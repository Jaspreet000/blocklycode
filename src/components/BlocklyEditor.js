import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import "blockly/javascript";
import { javascriptGenerator } from "blockly/javascript";
import {
  PlayIcon,
  TrashIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  CommandLineIcon,
  ViewColumnsIcon,
  CubeIcon,
  Square3Stack3DIcon,
  PuzzlePieceIcon,
  WindowIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/solid";
import { initCustomBlocks, initBlockGenerators } from "./BlocklyConfig";

const CategoryIcon = ({ category }) => {
  const icons = {
    Variables: <CubeIcon className="w-5 h-5" />,
    Math: <Square3Stack3DIcon className="w-5 h-5" />,
    Output: <ViewColumnsIcon className="w-5 h-5" />,
    Logic: <PuzzlePieceIcon className="w-5 h-5" />,
  };
  return icons[category] || null;
};

const BlocklyEditor = () => {
  const workspaceRef = useRef(null);
  const [workspace, setWorkspace] = useState(null);
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [view, setView] = useState("workspace");
  const [isInitialized, setIsInitialized] = useState(false);

  const categories = [
    {
      name: "Variables",
      colour: "#5C6BC0",
      blocks: [{ type: "set_variable" }],
    },
    {
      name: "Math",
      colour: "#4CAF50",
      blocks: [{ type: "arithmetic_operations" }, { type: "math_number" }],
    },
    {
      name: "Output",
      colour: "#FF9800",
      blocks: [{ type: "print_output" }],
    },
    {
      name: "Logic",
      colour: "#9C27B0",
      blocks: [
        { type: "conditional_block" },
        { type: "logic_compare" },
        { type: "logic_boolean" },
      ],
    },
  ];

  useEffect(() => {
    if (!workspaceRef.current || workspace) return;

    const initializeWorkspace = async () => {
      try {
        // First initialize custom blocks
        initCustomBlocks();

        // Create workspace with initial toolbox
        const toolboxConfig = {
          kind: "flyoutToolbox",
          contents: [],
        };

        // Create the workspace
        const newWorkspace = Blockly.inject(workspaceRef.current, {
          toolbox: toolboxConfig,
          grid: {
            spacing: 20,
            length: 3,
            colour: "#ccc",
            snap: true,
          },
          move: {
            scrollbars: {
              horizontal: true,
              vertical: true,
            },
            drag: true,
            wheel: true,
          },
          zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
          },
          trashcan: true,
          media: "https://blockly-demo.appspot.com/static/media/",
        });

        // Initialize JavaScript generator with the workspace
        javascriptGenerator.init(newWorkspace);

        // Initialize block generators after workspace is created
        initBlockGenerators(newWorkspace);

        // Set the workspace in state
        setWorkspace(newWorkspace);
        setIsInitialized(true);

        // Handle workspace resize
        const handleResize = () => {
          Blockly.svgResize(newWorkspace);
        };

        // Setup resize observer
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(workspaceRef.current);

        // Initial resize
        handleResize();

        // Cleanup
        return () => {
          resizeObserver.disconnect();
          if (newWorkspace) {
            newWorkspace.dispose();
          }
        };
      } catch (error) {
        console.error("Error initializing Blockly:", error);
        setIsInitialized(false);
      }
    };

    initializeWorkspace();
  }, []);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.name);
    if (workspace) {
      try {
        const blockNodes = category.blocks.map((block) => {
          return `<block type="${block.type}"></block>`;
        });

        const flyoutXml = `<xml>${blockNodes.join("")}</xml>`;

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(flyoutXml, "text/xml");

        const flyout = workspace.getFlyout();
        if (flyout) {
          flyout.show(xmlDoc.documentElement);
        }
      } catch (error) {
        console.error("Error showing blocks:", error);
      }
    }
  };

  const handleRunClick = async () => {
    console.log("Run Code button clicked!", new Date().toISOString());

    if (!workspace) {
      console.error("Workspace is not initialized!");
      return;
    }

    console.log(
      "Current workspace blocks:",
      workspace.getAllBlocks(false).length
    );

    const { isValid, errorMessage } = validateBlocks();
    if (!isValid) {
      console.log("Block validation failed:", errorMessage);
      setOutput([{ type: "error", content: `Error: ${errorMessage}` }]);
      setExecutionStatus("error");
      setView("console");
      return;
    }

    await handleRunCode();
  };

  const handleRunCode = async () => {
    if (!workspace) {
      console.error("Workspace not initialized in handleRunCode");
      return;
    }

    console.log("Starting code execution...");
    setIsRunning(true);
    setExecutionStatus(null);
    setOutput([]);
    setView("console");

    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    try {
      setOutput([{ type: "info", content: "Running program..." }]);

      console.log = (...args) => {
        const message = args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ");
        setOutput((prev) => [...prev, { type: "log", content: message }]);
        originalConsoleLog.apply(console, args);
      };

      console.error = (...args) => {
        const message = args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ");
        setOutput((prev) => [
          ...prev,
          { type: "error", content: `Error: ${message}` },
        ]);
        originalConsoleError.apply(console, args);
      };

      const blocks = workspace.getAllBlocks(false);
      console.log("Number of blocks in workspace:", blocks.length);

      if (blocks.length === 0) {
        throw new Error("No blocks in workspace. Add some blocks to run code.");
      }

      // Generate code using javascriptGenerator
      const code = javascriptGenerator.workspaceToCode(workspace);
      console.log("Generated code:", code);

      if (!code.trim()) {
        throw new Error("No code could be generated from these blocks.");
      }

      // Execute the code
      const executeCode = new Function(`
        "use strict";
        return async function executeBlocklyCode() {
          try {
            ${code}
          } catch (e) {
            console.error('Runtime error:', e.message);
            throw e;
          }
        }
      `)();

      console.log("Executing code...");
      await executeCode();
      console.log("Code execution completed");

      if (output.length <= 1) {
        setOutput((prev) => [
          ...prev,
          {
            type: "success",
            content: "Program executed successfully with no output",
          },
        ]);
      }
      setExecutionStatus("success");
    } catch (error) {
      console.error("Execution error:", error);
      setExecutionStatus("error");
      setOutput((prev) => [
        ...prev,
        {
          type: "error",
          content: `Error: ${error.message || "An unknown error occurred"}`,
        },
      ]);
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      setIsRunning(false);
      console.log("Code execution finished, restored console functions");
    }
  };

  const validateBlocks = () => {
    const blocks = workspace.getAllBlocks(false);
    let isValid = true;
    let errorMessage = "";

    blocks.forEach((block) => {
      block.inputList.forEach((input) => {
        if (
          input.connection &&
          input.connection.targetConnection === null &&
          !input.optional
        ) {
          isValid = false;
          errorMessage = `Block "${block.type}" is missing a required connection`;
        }
      });
    });

    return { isValid, errorMessage };
  };

  const handleReset = () => {
    if (workspace) {
      workspace.clear();

      setOutput([]);
      setExecutionStatus(null);
      setShowOutput(false);
      setSelectedCategory(null);

      const flyout = workspace.getFlyout();
      if (flyout) {
        flyout.hide();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Responsive Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 py-2 px-3 sm:py-3 sm:px-4 lg:px-6 sticky top-0 z-[100]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-lg shrink-0">
              <CodeBracketIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                Blockly
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Build. Learn. Create.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                className={`px-2 sm:px-3 py-1.5 rounded-md flex items-center space-x-1 text-xs sm:text-sm ${
                  view === "workspace"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setView("workspace")}
              >
                <WindowIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Workspace</span>
              </button>
              <button
                className={`px-2 sm:px-3 py-1.5 rounded-md flex items-center space-x-1 text-xs sm:text-sm ${
                  view === "console"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setView("console")}
              >
                <ComputerDesktopIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Console</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`px-2 sm:px-4 py-1.5 bg-indigo-600 text-white rounded-lg flex items-center space-x-1 text-xs sm:text-sm ${
                  isRunning
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:bg-indigo-700"
                }`}
                onClick={handleRunClick}
                disabled={isRunning}
              >
                {isRunning ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
                <span className="hidden xs:inline">
                  {isRunning ? "Running..." : "Run Code"}
                </span>
              </button>
              <button
                className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={handleReset}
                title="Reset Workspace"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <div className="w-12 xs:w-16 sm:w-20 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="p-1 sm:p-2 space-y-1 sm:space-y-2 overflow-y-auto max-h-full">
            {categories.map((category) => (
              <button
                key={category.name}
                className={`w-full aspect-square xs:aspect-auto p-1 xs:p-1.5 sm:p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                  selectedCategory === category.name
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => handleCategoryClick(category)}
                title={category.name}
              >
                <div className="p-0.5 xs:p-1 sm:p-1.5 rounded-lg bg-gray-100">
                  <CategoryIcon category={category.name} />
                </div>
                <span className="text-[8px] xs:text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium truncate w-full text-center">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative">
          {/* Blockly Workspace */}
          <div
            className={`absolute inset-0 ${
              view === "workspace" && isInitialized ? "block" : "hidden"
            }`}
            style={{ background: "#f8fafc" }}
          >
            <div
              ref={workspaceRef}
              className="absolute inset-0"
              style={{
                width: "100%",
                height: "100%",
                visibility: isInitialized ? "visible" : "hidden",
              }}
            />
          </div>

          {/* Responsive Console Panel */}
          <div
            className={`absolute inset-0 bg-slate-50/95 backdrop-blur-sm transform transition-all duration-300 ease-in-out ${
              view === "console"
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0 pointer-events-none"
            }`}
          >
            <div className="h-full p-3 sm:p-4 lg:p-6 flex flex-col max-w-5xl mx-auto">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 p-2 sm:p-2.5 rounded-xl shrink-0">
                    <CommandLineIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Console Output
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      View your program's execution results
                    </p>
                  </div>
                </div>
                {executionStatus && (
                  <div
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-2 transition-all duration-300 shrink-0 ${
                      executionStatus === "success"
                        ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                        : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                    }`}
                  >
                    {executionStatus === "success" ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Execution Successful</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Execution Failed</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 bg-white rounded-xl sm:rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                <div className="border-b border-gray-100 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-400">
                    Output Terminal
                  </div>
                </div>

                <div className="p-3 xs:p-4 sm:p-6 overflow-auto max-h-[calc(100vh-16rem)] space-y-2 sm:space-y-3">
                  {output.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-500">
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-xl mb-3 sm:mb-4">
                        <CommandLineIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                      </div>
                      <p className="text-xs sm:text-sm text-center font-medium">
                        No output yet
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                        Run your code to see the results here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {output.map((line, index) => (
                        <div
                          key={index}
                          className={`transform transition-all duration-300 ease-out ${
                            index === output.length - 1 ? "animate-slideIn" : ""
                          }`}
                        >
                          <pre
                            className={`p-2 xs:p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm leading-relaxed ${
                              typeof line === "object"
                                ? line.type === "error"
                                  ? "bg-red-50 text-red-700 border border-red-100"
                                  : line.type === "success"
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : line.type === "info"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : "bg-gray-50 text-gray-700 border border-gray-100"
                                : "bg-gray-50 text-gray-700 border border-gray-100"
                            }`}
                          >
                            {typeof line === "object" ? (
                              <div className="flex items-start">
                                <span className="mr-2 sm:mr-3 shrink-0">
                                  {line.type === "error"
                                    ? "❌"
                                    : line.type === "success"
                                    ? "✅"
                                    : line.type === "info"
                                    ? "ℹ️"
                                    : "🔵"}
                                </span>
                                <span className="whitespace-pre-wrap break-words">
                                  {line.content}
                                </span>
                              </div>
                            ) : (
                              <span className="whitespace-pre-wrap break-words">
                                {line}
                              </span>
                            )}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .blocklyMainBackground {
          stroke: none !important;
        }
        .blocklyToolboxDiv {
          z-index: 70 !important;
        }
        .blocklyFlyout {
          z-index: 65 !important;
        }
        .blocklyBlockCanvas {
          z-index: 55 !important;
        }
        .blocklyBubbleCanvas {
          z-index: 75 !important;
        }
        .blocklyWidgetDiv {
          z-index: 80 !important;
        }
        .blocklyDropDownDiv {
          z-index: 85 !important;
        }
        .blocklyTooltipDiv {
          z-index: 90 !important;
        }
        .injectionDiv {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: #f8fafc !important;
        }
        .blocklyWorkspace {
          visibility: visible !important;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }

        /* Custom Scrollbar */
        .overflow-auto::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .overflow-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .overflow-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Additional Responsive Styles */
        @media (max-width: 640px) {
          .blocklyFlyoutButton {
            transform: scale(0.85);
          }
          .blocklyZoom {
            transform: scale(0.85);
            transform-origin: bottom right;
          }
          .blocklyTrash {
            transform: scale(0.85);
            transform-origin: bottom left;
          }
        }

        @media (max-width: 480px) {
          .blocklyFlyoutButton {
            transform: scale(0.75);
          }
          .blocklyZoom {
            transform: scale(0.75);
            transform-origin: bottom right;
          }
          .blocklyTrash {
            transform: scale(0.75);
            transform-origin: bottom left;
          }
        }
      `}</style>
    </div>
  );
};

export default BlocklyEditor;
