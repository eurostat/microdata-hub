// "createCategorisationForm.js" is a JavaScript module that creates a form with dropdown menus for selecting microdata categories.
import { createDropdownLabel, createSelectDomElement } from "./utils.js";
/**
 * Builds a dropdown menu with the given name, label text, and options.
 * @param {string} id - The name attribute for the dropdown menu.
 * @param {string} labelText - The text to display as the label for the dropdown menu.
 * @param {Array<Object>} options - An array of objects containing the options for the dropdown menu.
 * @returns {HTMLDivElement} - A div element containing the dropdown menu.
 */
function buildDropdownMenu(id, labelText, options) {
	const select = createSelectDomElement(id);

	const label = createDropdownLabel(labelText, id);

	options.forEach((option) => {
		Object.entries(option).forEach(([catId, catName]) => {
			const optionElement = document.createElement("option");
			optionElement.value = catId;
			optionElement.textContent = catName;
			select.appendChild(optionElement);
		});
	});

	const container = document.createElement("div");
	container.classList.add("col-md");

	container.appendChild(label[0]);
	container.appendChild(select);

	return container;
}

/**
 * Sorts and organizes the category scheme options based on the provided category scheme data.
 * @param {Array} categorySchemeData - An array of objects containing category scheme data.
 * @returns {Object} An object with sorted category scheme options.
 */
function transformCategoryDataForDropdowns(categorySchemeData) {
	// some data is not needed for the dropdowns
	const filteredData = categorySchemeData.filter((item) => !["LFS","SILC"].includes(item.id));
	const output = {};

	filteredData.forEach((item) => {
		if (!output[item.categorySchemeId]) {
			output[item.categorySchemeId] = [];
		}
		const obj = {};
		obj[item.id] = item.name;
		output[item.categorySchemeId].push(obj);
		output[item.categorySchemeId].sort((a, b) => {
			const aKey = Object.keys(a)[0];
			const bKey = Object.keys(b)[0];
			return aKey.localeCompare(bKey);
		});
	});

	return output;
}

/**
 * Generates a dropdown form based on the provided formatted category schemes.
 * @param {Object} formattedCategorySchemes - An object containing formatted category schemes.
 * @returns {HTMLFormElement} - The generated form element with dropdowns and a submit button.
 */
function constructDropdownForm(formattedCategorySchemes) {
	const form = document.createElement("form");
	form.id = "category-form";
	form.classList.add("container");

	const bsGridDiv = document.createElement("div");
	bsGridDiv.classList.add("row", "g-3", "align-items-end", "d-flex");

	for (const categoryKey in formattedCategorySchemes) {
		if (Object.hasOwnProperty.call(formattedCategorySchemes, categoryKey)) {
			const keyLCase = categoryKey.toLowerCase();
			const keyToLabel = keyLCase.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
			const labelString = keyToLabel + " Selector";


			const dropdown = buildDropdownMenu(categoryKey, labelString, formattedCategorySchemes[categoryKey]);
			bsGridDiv.appendChild(dropdown);
		}
	}

	const submitButton = document.createElement("button");
	submitButton.id = "submit-button";
	submitButton.classList.add("btn", "btn-primary");
	submitButton.setAttribute("type", "submit");
	submitButton.textContent = "Submit";
	const submitButtonContainer = document.createElement("div");
	submitButtonContainer.classList.add("col-md-auto", "mb-3");
	submitButtonContainer.appendChild(submitButton);
	bsGridDiv.appendChild(submitButtonContainer);

	form.appendChild(bsGridDiv);

	return form;
}

/**
 * Renders a header form with dropdown options based on the provided category scheme data.
 * @param {any} categorySchemeData - The data used to generate the dropdown options.
 * @returns {Promise<void>} - A promise that resolves once the form is rendered.
 */
export async function microdataSelectionForm(categorySchemeData) {
	const formattedCategorySchemes = transformCategoryDataForDropdowns(categorySchemeData);
	const form = constructDropdownForm(formattedCategorySchemes);
	document.getElementById("category-form-container").appendChild(form);
}
