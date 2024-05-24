# MDHUB Prototype

## Overview
The MDHUB Prototype is an interactive web-based platform crafted to simplify the process of exploring and understanding statistical concepts. It utilizes a collection of JavaScript modules that work in tandem to retrieve, interpret, and exhibit data sourced from Eurostat's SDMX API. With its user-friendly interface, the MDHUB Prototype serves as an essential asset for researchers, statisticians, and anyone with a keen interest in data, enabling them to effortlessly navigate through intricate statistical information. 


## MDHUB Prototype: Feature Summary

Here's a brief summary of its key features:

- **Dynamic Data Categorization**: Users can select from various microdata categories through a dynamic form, enabling targeted data exploration.

- **Data Fetching and Caching**: The application efficiently retrieves data from the Eurostat SDMX API, caching responses to optimize performance.

- **Interactive Tables**: It features interactive tables that display concepts and countries' participation in dataflows, with expandable sections for detailed information.

- **Modal Dialogs**: Detailed code lists associated with statistical concepts are presented in modal dialogs, allowing for deeper data interaction.

- **Data Parsing and Transformation**: Raw data from the API is parsed and transformed into structured formats, ready for display and interaction.

- **Session Storage**: Utilizes session storage keys for consistent data handling, ensuring a seamless user experience.

- **Modular Design**: The application's modular architecture facilitates easy maintenance and the potential for future enhancements.



## Modules

### index.html
Serves as the entry point of the application, setting up the structure and linking necessary stylesheets and scripts.

### main.js
Acts as the central hub that imports other modules, sets up event listeners, and initializes the application's core functionalities.

### dataFetcher.js
Handles all HTTP requests to the SDMX API, fetching necessary data and caching responses for efficient reuse.

### dataParser.js
Processes raw data from the API, transforming it into a structured format suitable for use by other modules.

### createCategorisationForm.js
Generates a dynamic form with dropdown menus for user interaction, allowing the selection of various microdata categories.

### createCodesTable.js
Creates a detailed view of codes associated with specific concepts, presented in a modal dialog for user interaction.

### createConceptsTable.js
Generates an interactive table displaying concepts, which expands to show detailed information upon user interaction.

### mainDataTableProducer.js
Prepares and populates the main data table with processed data, providing an overview of concepts and their categorizations.

### createCountriesTable.js
Constructs a table view that shows the participation of countries in various dataflows, highlighting international collaboration.

### sessionStorageKeys.js
Defines constants for session storage keys, ensuring consistent data storage and retrieval across the application.

## Usage
Users can interact with the application through a web interface, selecting categories, viewing concepts, and exploring country-specific data. The application provides a user-friendly way to navigate complex statistical data and metadata.

## Development
The application is modular, making it easy to maintain and extend. Developers can add new features or modify existing ones by updating the corresponding JavaScript modules.

## Application Structure
The MDHUB Prototype is structured into several layers, each responsible for different aspects of the application:
- **Presentation Layer**: Handles the display and user interactions within the browser.
- **Data Layer**: Manages API calls, data parsing, and session storage.
- **Logic Layer**: Contains the business logic that drives the application's core functionalities.