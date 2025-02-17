import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

// Custom block definitions
export const initCustomBlocks = () => {
  // Set Variable Block
  Blockly.Blocks["set_variable"] = {
    init: function () {
      this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("set variable")
        .appendField(new Blockly.FieldTextInput("x"), "VAR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#5C6BC0");
      this.setTooltip("Set a variable to a value");
    },
  };

  // Arithmetic Operations Block
  Blockly.Blocks["arithmetic_operations"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Number");
      this.appendValueInput("B")
        .setCheck("Number")
        .appendField(
          new Blockly.FieldDropdown([
            ["+", "ADD"],
            ["-", "SUBTRACT"],
            ["×", "MULTIPLY"],
            ["÷", "DIVIDE"],
          ]),
          "OP"
        );
      this.setOutput(true, "Number");
      this.setColour("#4CAF50");
      this.setTooltip("Perform arithmetic operations");
    },
  };

  // Print Output Block
  Blockly.Blocks["print_output"] = {
    init: function () {
      this.appendValueInput("TEXT").setCheck(null).appendField("print");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FF9800");
      this.setTooltip("Print a value to the console");
    },
  };

  // Conditional Block
  Blockly.Blocks["conditional_block"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck("Boolean").appendField("if");
      this.appendStatementInput("DO").setCheck(null).appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#9C27B0");
      this.setTooltip("Execute code if condition is true");
    },
  };
};

// JavaScript generator configurations
export const initBlockGenerators = (workspace) => {
  if (!javascriptGenerator) {
    console.error("Blockly JavaScript generator not loaded");
    return;
  }

  // Variable block generator
  javascriptGenerator["set_variable"] = function (block) {
    const variable = block.getFieldValue("VAR");
    const value =
      javascriptGenerator.valueToCode(
        block,
        "VALUE",
        javascriptGenerator.ORDER_ASSIGNMENT
      ) || "0";
    return `let ${variable} = ${value};\n`;
  };

  // Math block generator
  javascriptGenerator["arithmetic_operations"] = function (block) {
    const operators = {
      ADD: ["+", javascriptGenerator.ORDER_ADDITION],
      SUBTRACT: ["-", javascriptGenerator.ORDER_SUBTRACTION],
      MULTIPLY: ["*", javascriptGenerator.ORDER_MULTIPLICATION],
      DIVIDE: ["/", javascriptGenerator.ORDER_DIVISION],
    };
    const operator = block.getFieldValue("OP");
    const [symbol, order] = operators[operator];
    const a = javascriptGenerator.valueToCode(block, "A", order) || "0";
    const b = javascriptGenerator.valueToCode(block, "B", order) || "0";
    const code = `${a} ${symbol} ${b}`;
    return [code, order];
  };

  // Print block generator
  javascriptGenerator["print_output"] = function (block) {
    const text =
      javascriptGenerator.valueToCode(
        block,
        "TEXT",
        javascriptGenerator.ORDER_NONE
      ) || '""';
    return `console.log(${text});\n`;
  };

  // Conditional block generator
  javascriptGenerator["conditional_block"] = function (block) {
    const condition =
      javascriptGenerator.valueToCode(
        block,
        "CONDITION",
        javascriptGenerator.ORDER_NONE
      ) || "false";
    const statements = javascriptGenerator.statementToCode(block, "DO");
    return `if (${condition}) {\n${statements}}\n`;
  };

  // Initialize the generator with the workspace
  javascriptGenerator.init(workspace);

  // Add custom styles
  const blockStyles = {
    variable_blocks: {
      colourPrimary: "#5C6BC0",
      colourSecondary: "#9FA8DA",
      colourTertiary: "#C5CAE9",
      hat: "cap",
    },
    math_blocks: {
      colourPrimary: "#4CAF50",
      colourSecondary: "#A5D6A7",
      colourTertiary: "#C8E6C9",
      hat: "cap",
    },
    list_blocks: {
      colourPrimary: "#FF9800",
      colourSecondary: "#FFCC80",
      colourTertiary: "#FFE0B2",
      hat: "cap",
    },
    logic_blocks: {
      colourPrimary: "#9C27B0",
      colourSecondary: "#CE93D8",
      colourTertiary: "#E1BEE7",
      hat: "cap",
    },
  };

  Object.keys(blockStyles).forEach((styleId) => {
    Blockly.Theme.defineTheme(styleId, {
      base: Blockly.Theme.Classic,
      blockStyles: {
        [styleId]: blockStyles[styleId],
      },
      componentStyles: {
        workspaceBackgroundColour: "#fafafa",
        toolboxBackgroundColour: "transparent",
        toolboxForegroundColour: "#1e293b",
        flyoutBackgroundColour: "#ffffff",
        flyoutForegroundColour: "#1e293b",
        flyoutOpacity: 0.95,
        scrollbarColour: "#cbd5e1",
        scrollbarOpacity: 0.8,
        insertionMarkerColour: "#4C51BF",
        insertionMarkerOpacity: 0.3,
      },
      fontStyle: {
        family: "Inter, system-ui, sans-serif",
        size: 13,
        weight: "500",
      },
    });
  });
};
