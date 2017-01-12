import * as _ from 'lodash';
import * as ng from 'angular';

ng.module('miqStaticAssets.dialogEditor')
  .service('DialogEditorModal', EditDialogService);

class EditDialogService {
  /** @ngInject */
  constructor(private $uibModal: any) {
  }

  /**
   * Show modal of the element.
   * @memberof EditDialogService
   * @function showModal
   * @param {number} index of tab, where the box is placed
   * @param {number} index of box, where the field is placed
   * @param {number} index of field
   */
  public showModal(tab: number, box: number, field: number) {
    let modalOptions = {
      template: require('./modal.html'),
      controller: DialogEditorModalController,
      controllerAs: 'vm',
      size: 'lg',
      resolve: {
        dialogDetails: function() {
          return {tabId: tab, boxId: box, fieldId: field};
        },
      },
    };
    let modal = this.$uibModal.open(modalOptions);

    return modal.result;
  }
}

class DialogEditorModalController {
  public modalTab: string = 'element_information';
  public modalData: any;
  public element: string;
  public categories: any;
  public dialog: any;

  /*@ngInject*/
  constructor(private dialogDetails: any,
              private $uibModalInstance: any,
              private CollectionsApi: any,
              private DialogEditor: any) {
    ng.extend(this, {
      dialog: this.dialogDetails,
      saveDialogFieldDetails: this.saveDialogFieldDetails,
      deleteField: this.deleteField,
      modalUnchanged: this.modalUnchanged,
      addEntry: this.addEntry,
      removeEntry: this.removeEntry,
      modalTabSet: this.modalTabSet,
      modalTabIsSet: this.modalTabIsSet,
      currentCategoryEntries: this.currentCategoryEntries,
    });

    // recognize edited element type
    if (ng.isUndefined(this.dialog.fieldId)
     && ng.isUndefined(this.dialog.boxId)
     && ng.isDefined(this.dialog.tabId)) {
      this.element = 'tab';
    } else if (ng.isUndefined(this.dialog.fieldId)
            && ng.isDefined(this.dialog.boxId)
            && ng.isDefined(this.dialog.tabId)) {
      this.element = 'box';
    } else if (ng.isDefined(this.dialog.fieldId)
            && ng.isDefined(this.dialog.boxId)
            && ng.isDefined(this.dialog.tabId)) {
      this.element = 'field';
    }

    // clone data from service
    switch (this.element) {
      case 'tab':
        this.modalData = _.cloneDeep(
          this.DialogEditor.getDialogTabs()[
            this.DialogEditor.activeTab
          ]
        );
        break;
      case 'box':
        this.modalData = _.cloneDeep(
          this.DialogEditor.getDialogTabs()[
            this.DialogEditor.activeTab
          ].dialog_groups[
            this.dialog.boxId
          ]
        );
        break;
      case 'field':
        this.modalData = _.cloneDeep(
          this.DialogEditor.getDialogTabs()[
            this.DialogEditor.activeTab
          ].dialog_groups[
            this.dialog.boxId
          ].dialog_fields[
            this.dialog.fieldId
          ]
        );
        // load categories from API, if the field is Tag Control
        if (this.modalData.type === 'DialogFieldTagControl') {
          this.resolveCategories(this.CollectionsApi).then(function(categories: any) {
            this.categories = categories;
          });
        }
        break;
      default:
        break;
    }

    this.activate();
  }

  /**
   *
   */
  public activate() {
  }

  /**
   *
   */
  public modalTabSet(tab: string) {
    this.modalTab = tab;
  }

  /**
   *
   */
  public modalTabIsSet(tab: string) {
    return this.modalTab === tab;
  }

  /**
   * Check for changes in modal
   */
  public modalUnchanged() {
    switch (this.element) {
      case 'tab':
        return _.isMatch(
          this.DialogEditor.getDialogTabs()[
            this.DialogEditor.activeTab
          ],
          this.modalData
        );
      case 'box':
        return _.isMatch(
          this.DialogEditor.getDialogTabs()[
            this.DialogEditor.activeTab
          ].dialog_groups[
            this.dialog.boxId
          ],
          this.modalData
        );
      case 'field':
        return _.isMatch(
          this.DialogEditor.getDialogTabs()[
            this.DialogEditor.activeTab
          ].dialog_groups[
            this.dialog.boxId
          ].dialog_fields[
            this.dialog.fieldId
          ],
          this.modalData
        );
      default:
        break;
    }
  }

  /**
   * Store modified data to service
   */
  public saveDialogFieldDetails() {
    // TODO: add verification for required forms
    // store data to service
    switch (this.element) {
      case 'tab':
        this.DialogEditor.getDialogTabs()[
          this.DialogEditor.activeTab
        ].label = this.modalData.label;
        // description
        this.DialogEditor.getDialogTabs()[
          this.DialogEditor.activeTab
        ].description = this.modalData.description;
        break;
      case 'box':
        // label
        this.DialogEditor.getDialogTabs()[
          this.DialogEditor.activeTab
        ].dialog_groups[
          this.dialog.boxId
        ].label = this.modalData.label;
        // description
        this.DialogEditor.getDialogTabs()[
          this.DialogEditor.activeTab
        ].dialog_groups[
          this.dialog.boxId
        ].description = this.modalData.description;
        break;
      case 'field':
        this.DialogEditor.getDialogTabs()[
          this.DialogEditor.activeTab
        ].dialog_groups[
          this.dialog.boxId
        ].dialog_fields[
          this.dialog.fieldId
        ] = this.modalData;
        break;
      default:
        break;
    }

    // close modal
    this.$uibModalInstance.close();
  }

  /**
   * Delete dialog field selected in modal
   */
  public deleteField() {
    _.remove(
      this.DialogEditor.getDialogTabs()[
        this.DialogEditor.activeTab
      ].dialog_groups[
        this.dialog.boxId
      ].dialog_fields,
      function(field: any) {
        return field.position === this.dialog.fieldId;
      }
    );

    // close modal
    this.$uibModalInstance.close();
  }

  /**
   *
   */
  public resolveCategories() {
    let options = {
      expand: 'resources',
      attributes: ['description', 'single_value', 'children'],
    };

    return this.CollectionsApi.query('categories', options);
  }

  /**
   * Finds entries for the selected category
   */
  public currentCategoryEntries() {
    if (ng.isDefined(this.categories)) {
      return _.find(
        this.categories.resources,
        'id',
        Number(this.modalData.options.category_id)
      );
    }
  }

  /**
   * Add entry for radio button / dropdown select
   */
  public addEntry() {
    this.modalData.values.push(['', '']);
  }

  /**
   * Remove entry for radio button / dropdown select
   *
   * Parameter: entry -- entry to remove from array
   */
  public removeEntry(entry: any) {
    _.pullAt(this.modalData.values, entry);
  }
}
