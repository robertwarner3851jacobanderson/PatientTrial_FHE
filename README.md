# PatientTrial_FHE

A privacy-preserving platform for patient-centered clinical trial design, leveraging Fully Homomorphic Encryption (FHE) to enable anonymous and encrypted submission of patient preferences. Pharmaceutical companies can aggregate encrypted feedback to optimize trial protocols without accessing individual patient data.

## Project Overview

Clinical trials often struggle with patient recruitment, engagement, and designing trials that reflect real patient needs. Traditional methods of collecting patient input face several challenges:

* **Privacy concerns:** Patients may hesitate to share honest feedback due to identity exposure.
* **Bias in aggregation:** Centralized collection can unintentionally skew results or introduce human bias.
* **Limited transparency:** Patients cannot verify if their input influenced trial design.

PatientTrial_FHE addresses these challenges by using Fully Homomorphic Encryption to allow encrypted data submission and aggregation without exposing individual preferences.

## Key Features

### Patient Input Management

* **Anonymous Submissions:** Patients submit preferences without revealing their identity.
* **Encrypted Feedback:** Data is encrypted on the client side using FHE before transmission.
* **Category-based Input:** Preferences can be categorized by trial design aspects, e.g., dosage, visit frequency, endpoints.
* **Structured Reporting:** Patients provide structured feedback including importance ratings, comments, and optional suggestions.

### Aggregation & Analysis

* **Encrypted Computation:** FHE allows aggregating and computing statistics on encrypted data without decryption.
* **Preference Summaries:** Generate summaries such as average importance ratings or distribution of suggestions per trial aspect.
* **Trial Optimization:** Pharmaceutical teams use aggregated insights to improve trial design.
* **Data Integrity:** Aggregated results are verifiable while individual submissions remain private.

### Transparency & Trust

* **Immutable Records:** All submissions are stored in a tamper-proof manner.
* **Audit-friendly:** Aggregation computations are transparent and verifiable.
* **Patient Empowerment:** Patients can see anonymized summaries of how preferences influenced trial planning.

## Architecture

### Backend

* **FHE Engine:** Performs homomorphic aggregation on encrypted patient data.
* **API Layer:** Receives encrypted submissions and forwards them to the computation engine.
* **Data Store:** Stores encrypted inputs securely; no decryption keys are stored alongside data.

### Frontend

* **React + TypeScript UI:** User-friendly interface for submitting preferences.
* **Client-side Encryption:** Data encrypted before leaving the browser.
* **Interactive Dashboards:** Patients can explore trial categories and aggregated insights without exposing sensitive information.

### Workflow Diagram

1. Patient opens platform and selects trial.
2. Preferences are entered via the interface.
3. Client-side FHE encrypts the input.
4. Encrypted input is sent to the backend.
5. FHE engine aggregates inputs across all patients.
6. Summarized, anonymized insights are made available to trial designers.

## Technology Stack

### Homomorphic Encryption

* **FHE Libraries:** Supports addition and multiplication operations on encrypted data.
* **Client-side Encryption:** Ensures data privacy from the moment of entry.
* **Secure Aggregation:** Enables computation of averages, counts, and weighted scores without revealing individual responses.

### Backend

* Node.js with Express: API server for handling encrypted submissions.
* Database: Stores encrypted data securely; schema optimized for homomorphic computation.
* Task Queue: Handles aggregation and summarization asynchronously.

### Frontend

* React 18 + TypeScript: Modern, responsive interface.
* TailwindCSS: Flexible styling for dashboards and forms.
* Charts & Analytics: Interactive visualization of aggregated patient preferences.

## Installation

### Prerequisites

* Node.js 18+ or higher.
* npm / yarn / pnpm package manager.
* Modern browser with WebAssembly support (for client-side FHE).

### Setup Steps

1. Clone repository.
2. Install dependencies: `npm install`.
3. Start backend: `npm run server`.
4. Start frontend: `npm run client`.
5. Open application in browser and submit test feedback.

## Usage

* **Submit Preferences:** Patients can anonymously submit their trial design preferences.
* **View Aggregated Insights:** Trial designers can explore encrypted summaries without accessing individual data.
* **Category Filtering:** Focus on specific aspects of trial design such as endpoints, visit frequency, or treatment types.
* **Real-time Updates:** Aggregated statistics refresh automatically as new submissions are processed.

## Security and Privacy

* **Full Encryption:** Patient data is encrypted end-to-end using FHE.
* **No Personal Data Storage:** No identifiers or personal information is stored.
* **Tamper-proof Aggregation:** Data integrity is maintained even during computation.
* **Anonymity by Default:** System designed to prevent any link between input and individual.

## Roadmap

* **Enhanced FHE Operations:** Support more complex statistical computations on encrypted data.
* **Mobile Interface:** Optimize for tablet and smartphone submission.
* **Multi-trial Management:** Support simultaneous aggregation across multiple clinical trials.
* **Data Visualization Improvements:** Interactive charts and heatmaps of patient preference trends.
* **Regulatory Compliance:** Ensure platform aligns with patient data protection regulations.

## Why FHE Matters

Fully Homomorphic Encryption enables computation on encrypted patient feedback without ever decrypting individual submissions. This ensures:

* **Absolute privacy:** Patients can share preferences without fear of exposure.
* **Trustworthy aggregation:** Pharmaceutical companies get reliable insights without accessing raw data.
* **Regulatory safety:** Data stays encrypted, mitigating risks associated with sensitive health information.
* **Ethical trial design:** Patient input shapes trials while respecting anonymity.

## Conclusion

PatientTrial_FHE combines privacy, security, and advanced encryption to empower patients and improve clinical trial design. By leveraging FHE, it ensures that patient preferences contribute meaningfully to research while protecting individual privacy.

---

Built with ❤️ for privacy-preserving, patient-centered clinical research.
