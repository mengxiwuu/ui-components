import AbstractModal from '../abstractModal';

class ModalFieldController {
  public modalData: any;
}

/**
 * @memberof miqStaticAssets
 * @ngdoc component
 * @name dialogEditorModalField
 * @description
 *    Component contains templates for the modal for editing dialog editors
 *    field (group) details
 * @example
 * <dialog-editor-modal-field></dialog-editor-modal-field>
 */
export default class ModalFieldTemplate extends AbstractModal {
  public template = require('./field.html');
}
