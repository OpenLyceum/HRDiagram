/**
 * HRDiagramKeyboardHelpContent.ts
 *
 * The keyboard-help dialog ("?" in the navigation bar). Each screen passes the options that match
 * the controls it actually has:
 *  - moveStar: CursorStarNode markers (arrows, Shift for fine steps) — Explore, Radius
 *  - selectStar: the Star Samples plot (left/right step through stars, Escape clears)
 *  - sliders: HSliders — Explore, Gaia Census
 *  - comboBox: AxisControlsNode / find combo boxes — Explore, Star Samples, Gaia Census
 * Basic actions (with checkbox content) are always shown.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TextKeyNode,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

type HRDiagramKeyboardHelpContentOptions = {
  moveStar?: boolean;
  selectStar?: boolean;
  sliders?: boolean;
  comboBox?: boolean;
};

export class HRDiagramKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor(options: HRDiagramKeyboardHelpContentOptions = {}) {
    const strings = StringManager.getInstance().getCommonStrings().keyboardHelp;
    const leftColumn: KeyboardHelpSection[] = [];
    const rightColumn: KeyboardHelpSection[] = [];

    if (options.moveStar) {
      leftColumn.push(
        new KeyboardHelpSection(strings.titleStringProperty, [
          KeyboardHelpSectionRow.labelWithIcon(strings.moveStringProperty, KeyboardHelpIconFactory.arrowKeysRowIcon()),
          KeyboardHelpSectionRow.labelWithIcon(
            strings.moveFineStringProperty,
            KeyboardHelpIconFactory.shiftPlusIcon(KeyboardHelpIconFactory.arrowKeysRowIcon()),
          ),
        ]),
      );
    }
    if (options.selectStar) {
      leftColumn.push(
        new KeyboardHelpSection(strings.selectTitleStringProperty, [
          KeyboardHelpSectionRow.labelWithIcon(
            strings.selectStarStringProperty,
            KeyboardHelpIconFactory.leftRightArrowKeysRowIcon(),
          ),
          KeyboardHelpSectionRow.labelWithIcon(strings.clearSelectionStringProperty, TextKeyNode.esc()),
        ]),
      );
    }
    if (options.sliders) {
      leftColumn.push(new SliderControlsKeyboardHelpSection());
    }
    if (options.comboBox) {
      rightColumn.push(new ComboBoxKeyboardHelpSection());
    }
    rightColumn.push(new BasicActionsKeyboardHelpSection({ withCheckboxContent: true }));

    super(leftColumn, rightColumn);
  }
}
