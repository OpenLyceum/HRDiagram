/**
 * HRDiagramKeyboardHelpContent.ts
 *
 * The keyboard-help dialog ("?" in the navigation bar) for the screens with a movable star: moving the
 * star, then the standard slider, combo box and basic-action sections.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class HRDiagramKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getCommonStrings().keyboardHelp;
    const moveStar = new KeyboardHelpSection(strings.titleStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(strings.moveStringProperty, KeyboardHelpIconFactory.arrowKeysRowIcon()),
      KeyboardHelpSectionRow.labelWithIcon(
        strings.moveFineStringProperty,
        KeyboardHelpIconFactory.shiftPlusIcon(KeyboardHelpIconFactory.arrowKeysRowIcon()),
      ),
    ]);
    super(
      [moveStar, new SliderControlsKeyboardHelpSection()],
      [new ComboBoxKeyboardHelpSection(), new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
