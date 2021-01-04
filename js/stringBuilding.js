import { CHROMEID_NAME, WINDOWS_ID_EDIT_BUTTON, TABS_ID_CHECKBOX } from "./management.js";

export const buildWindowHeaderButtonId = myWindow => `header${myWindow[CHROMEID_NAME]}`
export const buildWindowEditButtonId = myWindow => `${WINDOWS_ID_EDIT_BUTTON}${myWindow[CHROMEID_NAME]}`
export const buildWindowEditInputGroupId = myWindow => `editWindowTitleIGroup${myWindow[CHROMEID_NAME]}`
export const buildWindowEditInputId = myWindow => `editWindowTitleInput${myWindow[CHROMEID_NAME]}`
export const buildWindowEditOkId = myWindow => `editWindowTitleOk${myWindow[CHROMEID_NAME]}`
export const buildWindowCollapseButtonId = myWindow => `windowB${myWindow[CHROMEID_NAME]}`
export const buildTabCheckboxId = tab => `${TABS_ID_CHECKBOX}${tab.tabId}`
export const buildWindowBodyParentId = myWindow => `collapse${myWindow[CHROMEID_NAME]}`
export const getWindowOrTabIdFromElementId = element => element.id.match(/(\d*)$/)[0]
export const getWindowOrTabIdFromId = str => str.match(/(\d*)$/)[0]