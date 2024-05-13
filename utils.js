// "utils.js" 

export function extractValues(str) {
  const regex = /^(.+)\((.+)\)(.*)$/;
  const match = str.match(regex);
  if (match) {
    const values = match[3].split(".");
    return {
      id: match[1],
      version: match[2],
      value: values[values.length - 1],
    };
  } else {
    return null;
  }
}

export function extractLabelFromDsId(dsId) {
  return dsId.replace("ANON_", "").replace("_DSD", "");
}

export function parseStringUrn(urnString) {
  const codes = urnString.split(":");
  return extractValues(codes[codes.length - 1]);
}


export function setStorageData(storageName, data) {
	sessionStorage.setItem(storageName, JSON.stringify(data));
}
export function getStorageData(storageName) {
	const item = sessionStorage.getItem(storageName);
  return item ? JSON.parse(item) : null;
}

// dropdown menu components
export function createSelectElement(title, id) {
	return $("<select>")
		.addClass("form-select mb-3")
		.attr("title", title)
		.attr("id", id)
}
export function addChangeListenerToSelect(select, column) {
	select.on("change", function () {
		const selectedValue = select.val();
		if (selectedValue === "-") {
			column.search('').draw();
		} else {
			column.search(selectedValue, { exact: true }).draw();
		}
	});
}

export function addOptionsToSelect(select, column) {
	column
		.data()
		.unique()
		.sort()
		.each(function (d) {
			if (d.trim() !== "") {
				select.append(new Option(d));
			}
		});
}
export function createDropdownLabel(labelText,id) {
	return $("<label>")
		.attr("for", id)
		.addClass("form-label")
		.text(labelText);
}
export function createFlexContainer() {
	return $("<div>")
		.addClass("d-flex align-items-center")
}
export function createSelectDomElement(id) {
	const select = document.createElement("select");
	select.classList.add("form-select", "mb-3");
	select.setAttribute("name", id);
	select.setAttribute("id", id);

	const defaultOption = document.createElement("option");
	defaultOption.textContent = "-";
	select.appendChild(defaultOption);
	return select;
}
