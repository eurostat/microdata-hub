# SDMX data modelling for microdata

This document presents an overview of how microdata collections have been modelled using the SDMX standard.

The objective of this document is not to present a detailed overview of the SDMX standard itself. In order to know more about the SDMX standard, the reader is invited to read the technical specifications available on the official SDMX website 

## Domains, collections and waves

A statistical domain is a subject-matter area for which microdata are collected.
A statistical domain may contain one or more microdata collections. A microdata collection is an activity which aims at extracting specific data from a particular group of statistical units (respondent), and which is usually repeated at regular time intervals.
Each microdata collection may contain one or more waves. A wave is a distinct period of time in which data is collected for a given microdata collection.

To illustrate these concepts, the following example can be provided:
- EU-SILC (European Statistics on Income and Living Conditions) is a statistical domain
- This domain contains four annual microdata collections (Household Data, Household Registry, Personal Data, Personal Registry)
- Each microdata collection has several waves for years 2021, 2022, 2023 etc. 

## Main SDMX objects used

- Each available wave of each microdata collection is represented by a *Dataflow*
- Each *Dataflow* is linked to a *Data Structure Definition (DSD)*, which describes the structure of the data collected under the *Dataflow*. It is in theory possible for multiple Dataflows to be linked to the same *DSD* (i.e. share the same data structure), but for microdata collections this is rare, and in general each *Dataflow* is linked to a distinct *DSD*.
- The *Data Structure Definition* describes the data structure by specifying the available variables. These variables are taken from a *Concept Scheme*. For each variable, the *DSD* specifies:
  - Whether the variable forms part of the key of the dataset, i.e. whether the variable is necessary to uniquely identify each data record in the microdata. If this is the case, the variable is classified in the *DSD* as a *Dimension* and its presence is mandatory in each record. If this is not the case, the variable is classified in the *DSD* as an *Attribute*. Each *Attribute* may be marked as being *Mandatory* or *Conditional* (optional) in each record.
  - The difference values a variable can take are its *Representation*. In case a variable is coded (i.e. can only take a predefined finite set of values), the variable is represented by a *Codelist*. In case the variable cannot be coded, the *DSD* specifies the expected format of the data, which usually includes the expected data type (e.g. "String" or "Double") and other characteristics, such as the minimum length, maximum length, minimum value, maximum value etc.
- *Data Providers* represent different organisations which provide microdata. *Provision Agreements* are used to link specific *Data Providers* to specific *Dataflows*, and thus indicate which countries / organisations have provided data for specific waves of each microdata collection.
- *Content Constraints* are used to indicate whether there are some restrictions on the codes specified in a codelist for specific variables. *Content Constraints* can be both inclusive (i.e. specify the allowed codes) or exclusive (i.e. specify the forbidden codes), but for microdata collections only inclusive constraints are used in practice. *Content Constraints* can be attached to
  - a *Dataflow*. In this case the constraint indicates that, in a specific wave of a microdata collection, only certain codes from a codelist are available for a given variable.
  - a *Provision Agreement*. In this case the constraint indicates that, for a specific country in a specific wave of a microdata collection, only certain codes from a codelist are available for a given variable.
 
The diagram below illustrates the relationship between the main SDMX objects listed above.

## Additional features

### Category Schemes
Three category schemes have also been introduced in order to group together *Dataflows* and *Data Structure Definitions (DSDs)* related to microdata collection according two certain properties. There are three relevant category schemes:

- [ESTAT+MICRODATA_DOMAINS+1.0](https://webgate.acceptance.ec.europa.eu/fusionregistry/items/categoryscheme.html?urn=urn:sdmx:org.sdmx.infomodel.categoryscheme.CategoryScheme=ESTAT:MICRODATA_DOMAINS(1.0)) : This Category Scheme contains one Category per each microdata collection. Each Category is linked to the *Dataflows* and *Data Structure Definitions (DSDs)* related to the relevant microdata collection.
- [ESTAT+MICRODATA_FILE_TYPE+1.0](https://webgate.acceptance.ec.europa.eu/fusionregistry/items/categoryscheme.html?urn=urn:sdmx:org.sdmx.infomodel.categoryscheme.CategoryScheme=ESTAT:MICRODATA_FILE_TYPE(1.0)) : This Category Scheme contains one Category per each kind of microdata file available, i.e. anonymised Scientific User Files (SUF) vs non-anonymised Secure Use Files (SEC). Each Category is linked to the *Dataflows* related to the relevant file type.
- [SDMX+MICRODATA_COLLECTION_YEAR+1.0](https://webgate.acceptance.ec.europa.eu/fusionregistry/items/categoryscheme.html?urn=urn:sdmx:org.sdmx.infomodel.categoryscheme.CategoryScheme=SDMX:MICRODATA_COLLECTION_YEAR(1.0)) : This Category Scheme contains one Category per reference year. Each Category is linked to the *Dataflows* related to the relevant year.

By using these category scheme, the *Dataflows* and *Data Structure Definitions (DSDs)* related to microdata collection can be identified and grouped by collection, year and file type.

### Concept role
Within a *Data Structure Definition*. certain concepts are related to generic concepts such as "AGE" or "SEX", though they may be called with different concept IDs. In order to indicate these relationships / links to generic concepts, we have employed the *Concept Role* property within the microdata *DSDs*.

The *Concept Role* element is associated to specific *Components* of a DSD and links them to generic concepts located in the *Concept Scheme* [ESTAT+CS+ESTAT_GENERAL_CONCEPTS+1.0](https://webgate.acceptance.ec.europa.eu/fusionregistry/items/conceptscheme.html?urn=urn:sdmx:org.sdmx.infomodel.conceptscheme.ConceptScheme=ESTAT:CS_ESTAT_GENERAL_CONCEPTS(1.0)).


