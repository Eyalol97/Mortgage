# Mortgage Assistant — Project Specifications

**Authors:** Eyal Nahum, Ori Brenner, Simha Magal
**Disclaimer:** Specific UI/UX behaviors are subject to user testing and may be adjusted for optimal GUI experience.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Components Table](#components-table)
3. [Project Structure](#project-structure)
4. [File Ownership](#file-ownership)
5. [Simulator (Client)](#simulator-client)
6. [Simulator (Server)](#simulator-server)
7. [Profile (Client)](#profile-client)
8. [Profile (Server)](#profile-server)
9. [Bot (Client)](#bot-client)
10. [Bot (Server)](#bot-server)
11. [Shared Files](#shared-files)
12. [Models](#models)
13. [Seed Data](#seed-data)
14. [Config Files](#config-files)
15. [System Prompt](#system-prompt)

---

## Product Overview

Mortgage Assistant helps everyday Israeli households navigate the mortgage process with clarity and confidence. It has three features: an educational AI Bot, a User Profile, and a Mortgage Simulator.

**Target user:** A first-time homebuyer who is overwhelmed by the complexity of mortgages and afraid of making an irreversible mistake. Every decision — feature, copy, UI flow, test case — should reduce her stress and give her clarity and a sense of control.

---

## Components Table

### Mortgage Bot

| Component | Job | Input | Output | Layer |
|---|---|---|---|---|
| Chat window | Displays conversation and opening message | Bot responses, user messages | Rendered chat UI | Frontend |
| Chips (quick buttons) | Let user pick a concept without typing | User click | Chip label sent as query | Frontend |
| Free-text input | Accepts natural language questions | User typed text | Convert to string | Frontend |
| Follow-up buttons | Offers next actions after a bot reply | Bot reply context | Pre-filled follow-up query | Frontend |
| Disclaimer box | Shows legal notice when advisory intent is detected | Guardrail decision = ADVISORY | Visible disclaimer message | Frontend |
| Intent classifier (Guardrail) | Categorizes input using a lightweight LLM before it reaches the main model | Raw user question | Category: EDUCATION / ADVISORY / OUT_OF_DOMAIN / AMBIGUOUS | Logic |
| Rule filter | Deterministic keyword check — makes final routing decision | Classifier category + raw text | ALLOW / ADVISORY_BLOCK / DOMAIN_BLOCK | Logic |
| Request router | Sends allowed queries to LLM; returns hardcoded response for blocked ones | Rule filter decision | LLM call or hardcoded reply | Logic |
| Chat history buffer | Keeps session context so follow-up questions make sense | Each user + bot message | Ordered message array passed to LLM | Logic |
| Context window manager | Trims history to stay within token limits | Full chat history | Truncated history safe for LLM | Logic |
| Session manager | Clears all history on page exit or refresh | Page unload event | Empty session, no data saved | Logic |
| Glossary lookup | Returns stored definition instantly for chip-selected concepts | Chip label / concept name | Static definition text (no LLM call) | Data |
| Glossary database | Stores approved mortgage term definitions | Concept name | Definition + metadata | Data |
| Guardrail rules store | Holds advisory keywords and out-of-domain blocklist | Rule filter request | Keyword / blocklist arrays | Data |
| Guardrail log | Records each routing decision for audit and analytics | Decision outcome + category | Anonymous log entry (no personal data) | Data |
| Chips usage counter | Tracks how often each chip is clicked | Chip click event | Incremented count in DB | Data |
| LLM handler | Sends approved questions to the main LLM and returns the answer | User question + chat history + RAG context + system prompt | Explanation text + verification question | AI |
| RAG retriever | Fetches relevant Bank of Israel / regulatory content to ground the answer | User question | Relevant document chunks injected into LLM prompt | AI |
| System prompt | Sets bot persona, tone, and rules for every LLM call | Static config | Instructions prepended to every LLM request | AI |

### User Profiles

| Component | Job | Input | Output | Layer |
|---|---|---|---|---|
| Onboarding screen | Explains the value of completing the profile; prompts user to start | User lands on page | CTA displayed, user proceeds to form | Frontend |
| Profile form | Collects income, equity, savings, and household size | User typed values (partial or full) | Raw field values sent for validation | Frontend |
| Inline validation indicator | Shows green checkmark or error per field in real time | Current field value | Visual feedback (valid / invalid + reason) | Frontend |
| "Why do we need this?" tooltip | Explains the purpose of each field to build user trust | User hovers / taps info icon | Contextual explanation shown next to field | Frontend |
| Profile strength indicator | Shows how complete the profile is and how more data improves insights | Number of filled fields | Visual progress bar + completion message | Frontend |
| Confirmation screen | Tells the user their profile is saved and ready to use | Successful save response from backend | Success message displayed | Frontend |
| Personal area (edit view) | Lets user return and update any field at any time | Saved profile loaded from DB | Pre-filled editable form | Frontend |
| Field validation service | Enforces rules: no negatives, no numbers in name fields, no unsupported formats | Raw field values | Valid / invalid + reason per field | Logic |
| Profile save handler | Receives validated data and writes it to the database | Validated profile fields + user ID | Saved profile record, confirmation event | Logic |
| Profile update handler | Overwrites existing profile fields when user edits and saves | Updated field values + user ID | Updated record in DB | Logic |
| One-profile enforcement | Ensures each user ID is linked to exactly one profile | User ID on save request | Create new or update existing — never duplicate | Logic |
| Encryption layer | Encrypts profile data at rest and in transit using industry-standard methods | Raw profile record | Encrypted data stored / transferred | Logic |
| User profile model | Defines and stores the profile | Save / update request | Persisted encrypted profile record | Data |
| Auth / user identity | Links each profile to a unique registered user ID | Login session / auth token | Verified user ID used in all profile operations | Data |
| DB | Persists profile data securely in a hosted database | Encrypted profile records | Stored data available for retrieval by any feature | Data |

### Mortgage Simulator

| Component | Job | Input | Output | Layer |
|---|---|---|---|---|
| Simulator form | Collects all mandatory and optional user inputs | Repayment method, interest method, interest rate, 3 of 4 financial fields | Raw field values ready for validation | Frontend |
| Inline validation indicator | Shows real-time feedback per field (valid / error) | Current field value | Green checkmark or error message | Frontend |
| Solve button | Triggers calculation of the missing 4th financial variable | User click + 3 filled fields | Calculation request sent to backend | Frontend |
| Results display | Shows the calculated missing field, total interest, and total payment | Calculation results from backend | Formatted output in XX.X decimal format | Frontend |
| Mix manager (UI) | Lets user save current scenario and switch between Mix 1 / 2 / 3 | User saves or switches mix | Active mix displayed, others preserved in session | Frontend |
| Comparison table | Shows up to 3 mixes side by side for easy comparison | Up to 3 saved mix results | Side-by-side comparison view | Frontend |
| Amortization detail view | Shows full repayment schedule for a selected mix | User clicks a mix | Month-by-month breakdown of principal + interest | Frontend |
| PDF download button | Triggers generation and download of the results summary | User click | PDF file downloaded to device | Frontend |
| Disclaimer banner | States results are estimates only, not official bank offers | Page load | Permanent visible disclaimer | Frontend |
| "3 of 4" solver | Calculates the missing financial variable from the 3 provided | 3 of: property price, equity, duration, monthly payment | Calculated 4th value | Logic |
| Mortgage calculator | Computes Shpitzer / Equal Principal / Bullet repayment schedules | Loan amount, duration, interest rate, repayment method | Monthly payment, total interest, full amortization table | Logic |
| Validation service | Enforces logical and regulatory rules (LTV limits, max duration, equity vs. price) | All user field values | Valid / invalid + reason per rule | Logic |
| Default rate resolver | Applies current market average rate when user leaves the rate field empty | Selected mortgage track + empty rate field | Auto-filled rate from latest data | Logic |
| Session mix store | Temporarily holds up to 3 mixes during the session | Saved mix data | Persisted in-session mixes (cleared on exit) | Logic |
| PDF generator | Builds and returns a size-limited PDF from simulation results | Mix results + user inputs | Downloadable PDF file | Logic |
| Usage counter | Tracks how many times the simulator is used | Each "Solve" button click | Incremented count in DB | Data |
| Mortgage track library | Stores available mortgage types and their behaviors | Track selection request | Track definition + behavior rules | Data |
| Interest rate store | Holds the latest market-average rates per track, updated monthly from Bank of Israel | Bank of Israel API feed | Current default rates served to the solver | Data |
| Regulation rules store | Stores Bank of Israel limits (max LTV, max duration, mandatory track ratios) | Validation service request | Rule set used to flag violations | Data |
| Bank of Israel API sync | Fetches updated interest rates monthly and writes them to the interest rate store | Scheduled trigger (monthly) | Updated rate records in DB | Data |

---

## Project Structure

```
mortgage-project/
│
├── client/
│   ├── profile/                         # User Profile feature (Ori)
│   │   ├── profile.html                 # User Profile screen
│   │   ├── profile-ui.js                # Profile form behavior, completion progress indicator
│   │   └── profileForm.js               # Savings fields, tooltip per field
│
│   ├── simulator/                       # Mortgage Simulator feature (Simha)
│   │   ├── simulator.html               # Mortgage Simulator screen
│   │   ├── simulator-ui.js              # Simulator form + result display
│   │   ├── simulatorForm.js             # Loan input fields
│   │   └── comparisonTable.js           # Shows up to 3 mortgage mixes
│
│   └── bot/                             # Mortgage Bot feature (Eyal)
│       ├── home.html                    # Landing page + bot entry point
│       ├── bot-ui.js                    # Chat UI behavior
│       ├── chatWindow.js                # Message thread display, typing indicator
│       └── chatInput.js                 # User message input + send
│
├── sever/
│   ├── profile/                         # User Profile feature (Ori)
│   │   ├── profileRoutes.js             # API routes for User Profile
│   │   ├── profileController.js         # Saves/updates user profile
│   │   └── profileValidation.js         # Profile-specific field rules
│
│   ├── simulator/                       # Mortgage Simulator feature (Simha)
│   │   ├── simulatorRoutes.js           # API routes for Mortgage Simulator
│   │   ├── simulatorController.js       # Receives input, returns results
│   │   ├── pdfManager.js               # Creates PDF summary & API route for download
│   │   ├── mortgageCalculator.js        # Shpitzer / Equal Principal / Bullet
│   │   └── interestRateService.js       # Gets market/default interest rates
│
│   └── bot/                             # Mortgage Bot feature (Eyal)
│       ├── botRoutes.js                 # API routes for Mortgage Bot
│       ├── botController.js             # Handles bot requests
│       ├── mortgageBotPrompt.js         # Bot instructions and restrictions
│       ├── mortgageBotHandler.js        # Sends/receives LLM responses
│       └── bot-guard/
│           ├── intentClassifier.js      # Lightweight LLM intent classifier
│           └── ruleFilter.js            # Deterministic keyword filter
│
├── shared/                              # Used by all features
│   ├── index.html                       # Main app entry point / all navigation (Eyal)
│   ├── style.css                        # Design system: colors, layout, buttons (Eyal)
│   ├── server.js                        # Starts server, mounts all routes (Ori)
│   ├── db.js                            # MongoDB connection (Simha)
│   ├── auth.js                          # Login and signup (Ori)
│   ├── navbar.js                        # Shared navigation component (Eyal)
│   ├── inputField.js                    # Reusable form input (Eyal)
│   ├── validationMessage.js             # Error/success messages (Eyal)
│   ├── disclaimerBox.js                 # Legal/financial disclaimer (Eyal)
│   ├── validationService.js             # Shared validation rules (Eyal)
│   ├── regulationService.js             # Bank of Israel limits, LTV rules (Ori)
│   ├── formatCurrency.js                # Formats money values (Simha)
│   ├── formatDecimal.js                 # XX.X format (Simha)
│   ├── errorHandler.js                  # Shared error handling (Ori)
│   ├── env.js                           # Reads API keys and env variables (Ori)
│   └── models/                          # Database schemas (Simha)
│       ├── UserProfile.js               # User financial profile schema
│       ├── GlossaryTerm.js              # Mortgage glossary concepts
│       ├── UsageCounter.js              # Tracks feature usage
│       ├── InterestRate.js              # Saved/default mortgage rates
│       ├── GuardrailLog.js              # Logs guardrail decisions
│       └── seed/
│           ├── glossary.json            # Initial approved glossary data
│           ├── mortgageTracks.json      # Mortgage tracks and behaviors
│           └── guardrailRules.json      # Advisory keywords + blocklist
│
├── .env                                 # (Ori)
├── .gitignore                           # (Ori)
├── package.json                         # (Ori)
└── README.md                            # (Ori)
```

---

## File Ownership

| File | Feature | Owner |
|---|---|---|
| client/profile/profile.html | User Profile | Ori |
| client/profile/profile-ui.js | User Profile | Ori |
| client/profile/profileForm.js | User Profile | Ori |
| client/simulator/simulator.html | Mortgage Simulator | Simha |
| client/simulator/simulator-ui.js | Mortgage Simulator | Simha |
| client/simulator/simulatorForm.js | Mortgage Simulator | Simha |
| client/simulator/comparisonTable.js | Mortgage Simulator | Simha |
| client/bot/home.html | Mortgage Bot | Eyal |
| client/bot/bot-ui.js | Mortgage Bot | Eyal |
| client/bot/chatWindow.js | Mortgage Bot | Eyal |
| client/bot/chatInput.js | Mortgage Bot | Eyal |
| sever/profile/profileRoutes.js | User Profile | Ori |
| sever/profile/profileController.js | User Profile | Ori |
| sever/profile/profileValidation.js | User Profile | Ori |
| sever/simulator/simulatorRoutes.js | Mortgage Simulator | Simha |
| sever/simulator/simulatorController.js | Mortgage Simulator | Simha |
| sever/simulator/pdfManager.js | Mortgage Simulator | Simha |
| sever/simulator/mortgageCalculator.js | Mortgage Simulator | Simha |
| sever/simulator/interestRateService.js | Mortgage Simulator | Simha |
| sever/bot/botRoutes.js | Mortgage Bot | Eyal |
| sever/bot/botController.js | Mortgage Bot | Eyal |
| sever/bot/mortgageBotPrompt.js | Mortgage Bot | Eyal |
| sever/bot/mortgageBotHandler.js | Mortgage Bot | Eyal |
| sever/bot/bot-guard/intentClassifier.js | Mortgage Bot | Eyal |
| sever/bot/bot-guard/ruleFilter.js | Mortgage Bot | Eyal |
| shared/index.html | Shared | Eyal |
| shared/style.css | Shared | Eyal |
| shared/server.js | Shared | Ori |
| shared/db.js | Shared | Simha |
| shared/auth.js | Shared | Ori |
| shared/navbar.js | Shared | Eyal |
| shared/inputField.js | Shared | Eyal |
| shared/validationMessage.js | Shared | Eyal |
| shared/disclaimerBox.js | Shared | Eyal |
| shared/validationService.js | Shared | Eyal |
| shared/regulationService.js | Mortgage Simulator | Ori |
| shared/formatCurrency.js | Shared | Simha |
| shared/formatDecimal.js | Shared | Simha |
| shared/errorHandler.js | Shared | Ori |
| shared/env.js | Shared | Ori |
| shared/models/UserProfile.js | User Profile | Ori |
| shared/models/GlossaryTerm.js | Mortgage Bot | Eyal |
| shared/models/UsageCounter.js | Shared | Simha |
| shared/models/InterestRate.js | Mortgage Simulator | Simha |
| shared/models/GuardrailLog.js | Mortgage Bot | Eyal |
| shared/models/seed/glossary.json | Mortgage Bot | Eyal |
| shared/models/seed/mortgageTracks.json | Mortgage Simulator | Simha |
| shared/models/seed/guardrailRules.json | Mortgage Bot | Eyal |
| .env | Shared | Ori |
| .gitignore | Shared | Ori |
| package.json | Shared | Ori |
| README.md | Shared | Ori |

---

## Simulator (Client)

### simulator.html

**Purpose:** The main UI screen for the Mortgage Simulator feature. Renders the full simulator page including the input form, results display, mix manager, comparison table, amortization detail view, PDF download button, and disclaimer banner.

**Input:**
- User interactions (field inputs, button clicks, mix selection)
- Calculation results returned from backend
- Session-stored mix data for returning to a previously saved mix

**Logic:**
- On page load — render empty simulator form with mandatory fields and disclaimer banner
- Render "Solve" button — disabled until minimum required fields are filled
- On results received — display calculated missing field, total interest, and total payment in XX.X format
- Render mix manager tabs (Mix 1 / 2 / 3) — highlight active mix, preserve others in session
- On mix selection — load the selected mix's data into the results display
- On comparison view — render comparison table with all saved mixes side by side
- On amortization click — reveal full repayment schedule for the selected mix
- On PDF button click — trigger download flow

**Output:** Rendered HTML page containing:
- Simulator input form
- Inline validation indicators per field
- Solve button
- Results display section
- Mix manager tabs
- Comparison table section
- Amortization detail section
- PDF download button
- Permanent disclaimer banner

**Connects to:**
- simulator-ui.js — drives all interactive behavior
- simulatorForm.js — manages field logic and validation feedback
- comparisonTable.js — renders the side-by-side mix comparison
- shared/navbar.js, shared/inputField.js, shared/validationMessage.js, shared/disclaimerBox.js, shared/style.css

**Does not include:** JavaScript logic, backend calls, PDF generation, authentication, session storage, any other feature's UI.

---

### simulator-ui.js

**Purpose:** Controls all interactive behavior on the simulator page. Manages UI state across form input, results display, mix switching, comparison view, amortization detail view, and PDF download trigger.

**Input:**
- User interactions (field changes, button clicks, mix tab selection, amortization click)
- Calculation results received from backend
- Session mix data from session mix store

**Logic:**
- On page load — initialize empty form, disable Solve button, render disclaimer
- Monitor field completion — enable Solve button only when exactly 3 of 4 financial fields are filled plus all mandatory fields
- On Solve click — send form data to backend, show loading state, disable button during processing
- On results received — pass to results display section, enable "Save as Mix" option
- On mix save — store current result in session, update mix manager tabs
- On mix tab switch — load selected mix data into results display without clearing others
- On comparison view trigger — show comparison table with all saved mixes
- On amortization click — reveal full repayment schedule for selected mix
- On PDF button click — trigger PDF generation and download request
- On any failure — pass error to shared/validationMessage.js

**Output:**
- Correct UI section visible at each stage
- Solve button enabled/disabled state
- Active mix highlighted in mix manager
- Results, comparison, and amortization sections rendered with correct data
- Loading state during backend processing

**Connects to:** simulator.html, simulatorForm.js, comparisonTable.js, shared/validationMessage.js, shared/style.css

**Does not include:** Calculation logic, validation rule definitions, PDF generation, session storage management, database calls, any other feature's UI behavior.

---

### simulatorForm.js

**Purpose:** Manages the simulator form's field behavior — input handling, real-time validation feedback, "3 of 4" field tracking, and assembling the final data object sent to the backend on Solve.

**Input:**
- User typed/selected values per field (repayment method, interest method, interest rate, property price, equity, duration, monthly payment)
- Field focus/blur/change events

**Logic:**
- Track mandatory fields (repayment method, interest method, interest rate) — flag as incomplete if empty
- Track "3 of 4" financial fields (property price, equity, duration, monthly payment) — count filled fields and emit state to simulator-ui.js
- On each field change — pass value to shared/validationService.js and display result via shared/validationMessage.js
- If interest rate field left empty — flag it so backend applies default market rate via default rate resolver
- On Solve trigger — assemble all current field values into a single request object and send to backend

**Output:**
- Per-field validation state (valid / invalid + reason)
- Field completion state emitted to simulator-ui.js
- Assembled simulation request object sent to backend on Solve

**Connects to:** simulator.html, simulator-ui.js, shared/validationService.js, shared/validationMessage.js, sever/simulator/simulatorController.js

**Does not include:** UI state transitions or view management, calculation/solver logic, validation rule definitions, session mix storage, PDF logic, database calls.

---

### comparisonTable.js

**Purpose:** Renders the side-by-side comparison table of up to three saved mortgage mixes, allowing the user to clearly evaluate their options.

**Input:**
- Up to 3 saved mix result objects from session mix store (via simulator-ui.js)
- Each mix contains: repayment method, interest method, interest rate, property price, equity, duration, monthly payment, total interest, total payment

**Logic:**
- Receive saved mix data from simulator-ui.js
- For each mix — render a column with all its financial values formatted in XX.X decimal format via shared/formatDecimal.js and shared/formatCurrency.js
- If fewer than 3 mixes exist — render empty placeholder columns for missing slots
- Highlight the most cost-effective mix (lowest total interest) visually
- On mix column click — notify simulator-ui.js to open the amortization detail view for that mix

**Output:**
- Rendered comparison table with up to 3 mix columns
- Each column displays all relevant financial values in correct format
- Visual highlight on the most cost-effective mix
- Click event emitted to simulator-ui.js on mix column selection

**Connects to:** simulator.html, simulator-ui.js, shared/formatCurrency.js, shared/formatDecimal.js, shared/style.css

**Does not include:** Calculation/solver logic, session storage management, PDF logic, validation logic, amortization detail rendering, any other feature's UI.

---

## Simulator (Server)

### simulatorRoutes.js

**Purpose:** Defines the API routes for the Mortgage Simulator feature, mapping HTTP requests to the correct controller functions.

**Input:**
- Incoming HTTP requests (POST) from the client
- Request body containing simulation input data or PDF request
- Auth token / session from request headers

**Logic:**
- Define POST route for simulation — receive simulation request, forward to simulatorController.js
- Define GET route for interest rates — forward request for current default rates to simulatorController.js
- Define GET route for PDF download — forward PDF generation request to pdfManager.js
- On each route — verify request is valid and not abusive; reject with 401 if unauthorized
- Pass all valid requests to the appropriate handler — no business logic handled here

**Output:**
- Routed request forwarded to correct handler
- 401 response for unauthorized requests
- 404 response for unrecognized routes

**Connects to:** shared/server.js, sever/simulator/simulatorController.js, sever/simulator/pdfManager.js, shared/auth.js, shared/errorHandler.js

**Does not include:** Business logic, calculation, validation rules, database calls, PDF generation, any other feature's routes.

---

### simulatorController.js

**Purpose:** Handles the business logic for Mortgage Simulator operations — coordinating between validation, calculation, interest rate resolution, usage tracking, and returning results to the client.

**Input:**
- Verified simulation request containing: repayment method, interest method, interest rate (or empty), and 3 of 4 financial fields
- GET request for current default interest rates

**Logic:**
- On simulation POST — pass all field values to shared/regulationService.js for regulatory validation
- On validation failure — return error response with field and reason via shared/errorHandler.js
- On validation pass — check if interest rate field is empty; if yes, fetch current market average from interestRateService.js
- Pass validated and complete inputs to mortgageCalculator.js to compute the missing 4th field, total interest, and full amortization schedule
- Increment usage counter in DB via shared/models/UsageCounter.js
- Return formatted results to client
- On GET for interest rates — fetch current rates from interestRateService.js and return to client

**Output:**
- Calculated missing field value
- Total interest and total payment
- Full amortization schedule
- Current default interest rates (on GET)
- Error response on validation or calculation failure

**Connects to:** sever/simulator/simulatorRoutes.js, sever/simulator/mortgageCalculator.js, sever/simulator/interestRateService.js, shared/regulationService.js, shared/models/UsageCounter.js, shared/errorHandler.js, shared/env.js

**Does not include:** Route definitions, UI logic, PDF generation, validation rule definitions, session mix storage, direct database schema definitions.

---

### pdfManager.js

**Purpose:** Generates a size-limited, downloadable PDF summary of the user's simulation results and serves it to the client via a dedicated API route.

**Input:**
- Simulation results containing: repayment method, interest method, interest rate, all 4 financial fields, total interest, total payment, and full amortization schedule
- Up to 3 saved mix result objects if comparison is included

**Logic:**
- Receive simulation results and format all monetary values via shared/formatCurrency.js and decimal values via shared/formatDecimal.js
- Structure the PDF content — summary section (inputs + key outputs) and amortization table per mix
- If multiple mixes provided — include comparison table in PDF
- Enforce PDF size limit — truncate or simplify amortization table if output exceeds size threshold
- Generate PDF file using PDF generation library
- Return PDF file as a downloadable response to client

**Output:**
- Downloadable PDF file containing:
  - Simulation input summary
  - Key output values (missing field, total interest, total payment)
  - Amortization schedule per mix
  - Comparison table if multiple mixes exist
- Error response if generation fails or size limit is exceeded

**Connects to:** sever/simulator/simulatorRoutes.js, shared/formatCurrency.js, shared/formatDecimal.js, shared/errorHandler.js, shared/env.js

**Does not include:** Calculation/solver logic, validation rules, session mix storage, database reads or writes, UI logic, any other feature's data.

---

### mortgageCalculator.js

**Purpose:** The core calculation engine of the simulator. Computes the missing 4th financial variable, total interest, total payment, and full amortization schedule based on the user's inputs and selected repayment method.

**Input:**
- Validated inputs from simulatorController.js:
  - Repayment method (Shpitzer / Equal Principal / Bullet)
  - Interest rate
  - 3 of 4 financial fields (property price, equity, duration, monthly payment)

**Logic:**
- Derive loan amount — property price minus equity
- Identify the missing 4th field and apply the correct formula to solve for it based on repayment method:
  - **Shpitzer** — fixed monthly payment, decreasing interest portion over time
  - **Equal Principal (Keren Shava)** — fixed principal portion, decreasing monthly payment over time
  - **Bullet** — interest-only payments during loan period, full principal at end
- Calculate total interest — sum of all interest portions across full loan duration
- Calculate total payment — loan amount plus total interest
- Generate full amortization table — month-by-month breakdown of principal, interest, and remaining balance
- Format all output values to XX.X decimal precision via shared/formatDecimal.js

**Output:**
```json
{
  "missing_field": { "name": "string", "value": "number" },
  "total_interest": "number",
  "total_payment": "number",
  "amortization_table": [
    { "month": "number", "principal": "number", "interest": "number", "balance": "number" }
  ]
}
```

#### Calculation Formulas (must be implemented strictly)

**Shpitzer (Fixed Monthly Payment):**
```
M = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
```
- M = Monthly Payment
- P = Loan Amount
- r = Monthly Interest Rate (Annual Rate / 12)
- n = Duration in months

**Equal Principal (Keren Shava):**
```
Monthly Payment = (P / n) + (Remaining Balance * r)
```
- Principal portion (P / n) is fixed; interest is calculated on the remaining balance

**Bullet (Interest Only):**
```
Monthly Payment = P * r
```
- Principal is repaid in full at the end of the term

#### Calculation Cases (3 of 4 Solver)

| Case | Missing Field | Formula |
|---|---|---|
| 1 | Monthly Payment | Compute using relevant formula (Shpitzer / Keren Shava / Bullet) |
| 2 | Property Price | Reverse-engineer LoanAmount from Payment, Duration, Rate; then Price = LoanAmount + Equity |
| 3 | Equity | Reverse-engineer LoanAmount from Payment, Duration, Rate; then Equity = Price - LoanAmount |
| 4 | Duration | Derive LoanAmount; perform iterative search (1–360 months) to find Duration resulting in a payment closest to input MonthlyPayment |

#### Numerical Examples

1. **Solving for Monthly Payment:** Price=2,000,000, Equity=500,000, Duration=240 → LoanAmount=1,500,000 → calculate payment based on repayment method.
2. **Solving for Duration:** Price=2,000,000, Equity=500,000, Monthly Payment=9,500 → LoanAmount=1,500,000 → iterate on Duration to match 9,500 monthly payment.

**Connects to:** sever/simulator/simulatorController.js, shared/formatDecimal.js

**Does not include:** Regulatory validation, interest rate fetching, PDF generation, UI logic, database reads or writes, session storage.

---

### interestRateService.js

**Purpose:** Fetches and serves the latest market-average interest rates per mortgage track. Syncs monthly with the Bank of Israel API and provides current default rates to the simulator when a user leaves the rate field empty.

**Input:**
- Rate request from simulatorController.js specifying the selected mortgage track
- Scheduled monthly trigger for Bank of Israel API sync

**Logic:**
- On rate request — look up current rate for the requested mortgage track from shared/models/InterestRate.js
- If no rate found for track — return fallback error to simulatorController.js via shared/errorHandler.js
- On monthly sync trigger — call Bank of Israel API endpoint using credentials from shared/env.js
- Parse API response and extract rate per mortgage track
- Overwrite existing rate records in shared/models/InterestRate.js with updated values
- On API call failure — retain existing stored rates and log failure via shared/errorHandler.js

**Output:**
- Current market-average interest rate for the requested track (on rate request)
- Updated rate records written to DB (on monthly sync)
- Error response if rate unavailable or API call fails

**Connects to:** sever/simulator/simulatorController.js, shared/models/InterestRate.js, shared/env.js, shared/errorHandler.js

**Does not include:** Calculation logic, validation rules, PDF generation, UI logic, session storage, any other feature's data or rates.

---

## Profile (Client)

### profile.html

**Purpose:** The main UI screen for the User Profile feature. Renders the full profile page including onboarding CTA, data entry form, inline validation feedback, tooltips, profile strength indicator, and confirmation state.

**Input:**
- Saved profile data loaded from DB (for returning users — pre-fills the form)
- Auth session (confirms user identity)

**Logic:**
- On load — check if user has an existing profile; if yes, render form in edit mode with pre-filled values
- If no existing profile — render onboarding CTA screen first, then transition to empty form
- Render each field with its corresponding tooltip icon ("Why do we need this?")
- Display profile strength indicator that updates as fields are filled
- Show inline validation state per field (green checkmark / error message) in real time
- On successful save — render confirmation message

**Output:** Rendered HTML page containing:
- Onboarding CTA section
- Profile form (income, equity, savings, household size)
- Tooltip anchor per field
- Profile strength progress bar
- Inline validation indicators
- Confirmation section

**Connects to:** profile-ui.js, profileForm.js, shared/navbar.js, shared/inputField.js, shared/validationMessage.js, shared/style.css

**Does not include:** JavaScript logic or validation rules, backend calls or API requests, authentication logic, file upload functionality (post-MVP), any other feature's UI.

---

### profile-ui.js

**Purpose:** Controls all interactive behavior on the profile page. Manages UI state transitions between onboarding, form, and confirmation views, and drives the profile strength indicator updates.

**Input:**
- User interactions (button clicks, field focus/blur)
- Field completion state from profileForm.js
- Save response (success/failure) from backend

**Logic:**
- On page load — determine whether to show onboarding CTA or pre-filled edit form based on existing profile data
- On CTA button click — hide onboarding section, reveal form section
- On each field change — receive updated completion state and recalculate profile strength bar percentage
- On save button click — trigger form submission flow, disable button to prevent double submission
- On success response — hide form, reveal confirmation section
- On failure response — pass error to shared/validationMessage.js for display

**Output:**
- Correct UI section visible at each stage (onboarding → form → confirmation)
- Profile strength bar updated in real time
- Save button state (enabled / disabled)
- Error or success message rendered on screen

**Connects to:** profile.html, profileForm.js, shared/validationMessage.js, shared/style.css

**Does not include:** Field-level validation rules, API or database calls, authentication logic, tooltip content or behavior, any logic unrelated to UI state and transitions.

---

### profileForm.js

**Purpose:** Manages the profile form's field behavior — including input handling, real-time validation feedback, and tooltip display per field.

**Input:**
- User typed values per field (income, equity, savings, household size)
- Field focus/blur/change events

**Logic:**
- For each field — listen for change events and pass value to shared/validationService.js
- On validation response — display green checkmark or error message via shared/validationMessage.js
- Track which fields are filled and valid — emit completion state to profile-ui.js for strength indicator update
- On tooltip icon interaction (hover/tap) — display the relevant "Why do we need this?" explanation
- On save trigger — collect all current field values and pass as a single profile object to the backend via profileController.js

**Output:**
- Per-field validation state (valid / invalid + reason)
- Completion state object emitted to profile-ui.js
- Assembled profile data object sent to backend on save

**Connects to:** profile.html, profile-ui.js, shared/validationService.js, shared/validationMessage.js, sever/profile/profileController.js

**Does not include:** UI state transitions (onboarding / confirmation screens), validation rule definitions, database logic, authentication, profile strength bar rendering.

---

## Profile (Server)

### profileRoutes.js

**Purpose:** Defines the API routes for the User Profile feature, mapping HTTP requests to the correct controller functions.

**Input:**
- Incoming HTTP requests (POST, GET, PUT) from the client
- Auth token / session from request headers

**Logic:**
- Define GET route — fetch existing profile by user ID, forward to profileController.js
- Define POST route — receive new profile data, forward to profileController.js
- Define PUT route — receive updated profile data, forward to profileController.js
- On each route — verify auth token is present before forwarding; reject unauthorized requests with 401

**Output:**
- Routed request forwarded to profileController.js
- 401 response for unauthorized requests
- 404 response for unrecognized routes

**Connects to:** shared/server.js, sever/profile/profileController.js, shared/auth.js, shared/errorHandler.js

**Does not include:** Business logic or data processing, validation rules, database calls, any other feature's routes.

---

### profileController.js

**Purpose:** Handles the business logic for User Profile operations — receiving requests from the router, enforcing one-profile-per-user, and coordinating between validation, encryption, and the database.

**Input:**
- Verified user ID from profileRoutes.js
- Profile field values (income, equity, savings, household size)
- Request type (create / fetch / update)

**Logic:**
- On GET — retrieve existing profile record by user ID from DB, return to client
- On POST — check if a profile already exists for this user ID; if yes, reject (one-profile enforcement); if no, pass data to profileValidation.js
- On PUT — verify the profile being updated belongs to the requesting user ID, then pass updated fields to profileValidation.js
- After successful validation — encrypt profile data and write to DB via UserProfile.js
- On DB success — return confirmation response to client
- On any failure — pass error to shared/errorHandler.js

**Output:**
- GET: existing profile record returned to client
- POST/PUT: confirmation of successful save/update
- Appropriate error response on failure

**Connects to:** sever/profile/profileRoutes.js, sever/profile/profileValidation.js, shared/models/UserProfile.js, shared/errorHandler.js, shared/env.js

**Does not include:** Route definitions, UI logic, validation rule definitions, authentication logic, any other feature's business logic.

---

### profileValidation.js

**Purpose:** Enforces all server-side validation rules specific to User Profile fields before data is written to the database.

**Input:**
- Raw profile field values from profileController.js (income, equity, savings, household size)
- User ID

**Logic:**
- For each field — apply rules:
  - Values must be numeric where expected (income, equity, savings, household size)
  - No negative numbers allowed
  - Household size must be a positive whole number
  - No empty strings passed as valid values
- Cross-field check — at least one field must contain a valid value (partial save is allowed)
- On any rule failure — return invalid result with field name and reason
- On all checks passed — return valid result to profileController.js

**Output:**
```json
{ "is_valid": true, "errors": [{ "field": "string", "reason": "string" }] }
```

**Connects to:** sever/profile/profileController.js, shared/validationService.js

**Does not include:** UI feedback or rendering, database reads or writes, authentication, encryption, business logic beyond field rule enforcement.

---

## Bot (Client)

### home.html

**Purpose:** The landing page of the Mortgage Bot feature. Renders the chat window, opening message, chips, free-text input, send button, and disclaimer box.

**Input:**
- Page load event
- Pre-defined chips list loaded from glossary
- Bot responses and user messages rendered during session
- Guardrail decision triggering disclaimer visibility

**Logic:**
- On page load — render clean chat window with friendly opening message and chips above input box
- Render chips row — each chip displays a concept label and is clickable
- Render free-text input and send button
- Render disclaimer box — hidden by default, visible only when guardrail returns ADVISORY decision
- On page exit or refresh — session cleared, no content persisted

**Output:** Rendered HTML page containing:
- Chat window with opening message
- Chips (quick concept buttons)
- Free-text input field
- Send button
- Follow-up buttons area (rendered dynamically after bot reply)
- Disclaimer box (hidden by default)

**Connects to:** bot-ui.js, chatWindow.js, chatInput.js, shared/navbar.js, shared/inputField.js, shared/disclaimerBox.js, shared/style.css

**Does not include:** JavaScript logic or routing, LLM calls or guardrail logic, session storage or history management, glossary database access, any other feature's UI.

---

### bot-ui.js

**Purpose:** Controls all interactive behavior on the bot page. Orchestrates the flow between user input, chip selection, guardrail decisions, LLM responses, follow-up buttons, and disclaimer visibility.

**Logic:**
- On page load — initialize chat window, render chips, set disclaimer to hidden
- On chip click — pass chip label as query to backend, render user message in chat window
- On free-text send — pass input string to backend, render user message, clear input field
- On follow-up button click — pass pre-filled query to backend, render in chat window
- While awaiting response — show typing indicator
- On guardrail response:
  - EDUCATION / AMBIGUOUS — render bot reply, render follow-up buttons
  - ADVISORY — render bot reply, make disclaimer box visible
  - OUT_OF_DOMAIN — render hardcoded refusal message
- On page unload/refresh — trigger session clear

**Connects to:** home.html, chatWindow.js, chatInput.js, sever/bot/botController.js, shared/disclaimerBox.js, shared/style.css

**Does not include:** Guardrail logic or classification, LLM calls, session storage management, glossary database access, chat history buffer management, any other feature's UI behavior.

---

### chatWindow.js

**Purpose:** Renders and manages the message thread display inside the chat window.

**Logic:**
- On user message received — render as right-aligned message bubble
- On typing indicator show — render animated typing indicator as bot-side bubble
- On bot reply received — remove typing indicator, render as left-aligned message bubble
- On each new message — scroll chat window to bottom automatically
- On session clear — wipe all rendered messages

**Connects to:** home.html, bot-ui.js

---

### chatInput.js

**Purpose:** Manages the free-text input field and send button behavior.

**Logic:**
- Listen for input field changes — track current value as a string
- On send button click or Enter key press:
  - If input is empty or whitespace only — do nothing
  - If input contains valid text — pass string to bot-ui.js and clear input field
- Disable input field and send button while awaiting bot response
- Re-enable once bot reply is received

**Connects to:** home.html, bot-ui.js

---

## Bot (Server)

### botRoutes.js

**Purpose:** Defines the API routes for the Mortgage Bot feature.

**Logic:**
- Define POST route for user query — receive query and chat history, forward to botController.js
- Define GET route for chips — forward request for pre-defined chip list to botController.js
- On each route — perform basic request sanity check; reject malformed or empty requests with 400

**Connects to:** shared/server.js, sever/bot/botController.js, shared/errorHandler.js

---

### botController.js

**Purpose:** Handles the business logic for Mortgage Bot operations — coordinating the full request flow from incoming query through the two-layer guardrail, LLM call, and response delivery.

**Logic:**
- On chip selection — bypass guardrail, fetch definition directly from glossary lookup, return to client; increment chip usage counter
- On free-text query:
  - Pass raw input to intentClassifier.js for lightweight classification
  - Pass classifier result and raw input to ruleFilter.js for final routing decision
  - On DOMAIN_BLOCK — return hardcoded out-of-domain refusal; log decision to GuardrailLog.js
  - On ADVISORY_BLOCK — pass to mortgageBotHandler.js with advisory flag; log decision
  - On ALLOW / AMBIGUOUS — pass query and chat history to mortgageBotHandler.js; log decision
- Receive LLM response from mortgageBotHandler.js and return to client with guardrail decision metadata

**Connects to:** sever/bot/botRoutes.js, sever/bot/bot-guard/intentClassifier.js, sever/bot/bot-guard/ruleFilter.js, sever/bot/mortgageBotHandler.js, shared/models/GlossaryTerm.js, shared/models/GuardrailLog.js, shared/errorHandler.js

---

### mortgageBotPrompt.js

**Purpose:** Defines and exports the system prompt that sets the bot's persona, tone, rules, and behavioral boundaries. Prepended to every LLM request.

**Logic:**
- Define base system prompt including:
  - Bot persona — friendly, clear, educational, jargon-free
  - Domain restriction — mortgage and finance topics only
  - Advisory prohibition — never recommend a specific bank, track, or personal course of action
  - Objectivity rule — explain pros and cons only, no conclusions
  - Language rule — simple language; explain any professional term used
  - Verification rule — end every complex explanation with a guidance question
  - Ambiguity rule — ask for clarification if question lacks sufficient context
- If advisory flag is present — append advisory-specific instructions directing LLM to detail considerations and pros/cons without deciding

**Connects to:** sever/bot/mortgageBotHandler.js

---

### mortgageBotHandler.js

**Purpose:** Handles all communication with the main LLM. Assembles the full request and returns the response to botController.js.

**Logic:**
- Retrieve system prompt from mortgageBotPrompt.js
- Pass user query to RAG retriever — fetch relevant regulatory/Bank of Israel document chunks
- Pass full chat history through context window manager — trim to token-safe length
- Assemble final LLM request: system prompt + RAG context + trimmed chat history + current user query
- Send assembled request to LLM API using credentials from shared/env.js
- On successful response — extract reply text and return to botController.js
- On LLM API failure — return error to botController.js via shared/errorHandler.js

**Connects to:** sever/bot/botController.js, sever/bot/mortgageBotPrompt.js, shared/env.js, shared/errorHandler.js

---

### intentClassifier.js

**Purpose:** The first layer of the two-layer guardrail. Uses a lightweight LLM to classify user input into one of four categories.

**Logic:**
- Send raw query to lightweight LLM (e.g. claude-haiku) with a minimal classification prompt
- Classification prompt instructs model to return exactly one of:
  - `EDUCATION` — mortgage/finance question with no advisory intent
  - `ADVISORY` — request for personal recommendation or specific track/bank suggestion
  - `OUT_OF_DOMAIN` — unrelated to finance or mortgages
  - `AMBIGUOUS` — insufficient context to answer without clarification
- Parse LLM response and extract category string
- On unexpected or malformed response — default to `AMBIGUOUS`

**Output:** `{ "category": "EDUCATION" | "ADVISORY" | "OUT_OF_DOMAIN" | "AMBIGUOUS" }`

**Connects to:** sever/bot/botController.js, sever/bot/bot-guard/ruleFilter.js, shared/env.js, shared/errorHandler.js

---

### ruleFilter.js

**Purpose:** The second and final layer of the two-layer guardrail. Applies deterministic keyword and rule-based checks to make the final routing decision.

**Logic:**
- Load advisory keyword list and domain blocklist from guardrailRules.json
- Run deterministic keyword check on raw query against both lists — independent of classifier category
- Apply final routing decision:
  - If raw query matches domain blocklist → `DOMAIN_BLOCK` (regardless of classifier)
  - If raw query matches advisory keyword list → `ADVISORY_BLOCK` (regardless of classifier)
  - If classifier returned `OUT_OF_DOMAIN` and no keyword match found → `DOMAIN_BLOCK`
  - If classifier returned `ADVISORY` and no keyword match found → `ADVISORY_BLOCK`
  - If classifier returned `EDUCATION` or `AMBIGUOUS` and no keyword matches → `ALLOW`

**Output:** `{ "decision": "ALLOW" | "ADVISORY_BLOCK" | "DOMAIN_BLOCK" }`

**Connects to:** sever/bot/botController.js, shared/models/GuardrailLog.js, shared/errorHandler.js

---

## Shared Files

### validationService.js

**Purpose:** Defines and exports all shared validation rules used across features. Single source of truth for common field validation logic.

**Logic:**
- Apply rules based on field type:
  - Numeric fields — must be a valid positive number, no negatives
  - Name fields — must not contain numbers or special characters
  - Percentage fields — must be between 0 and 100
  - Whole number fields (e.g. household size, duration) — must be a positive integer
- On rule match — return valid result
- On rule failure — return invalid result with field name and reason

**Output:** `{ "is_valid": true, "field": "string", "reason": "string" }`

---

### regulationService.js

**Purpose:** Stores and enforces Bank of Israel regulatory rules used by the Mortgage Simulator.

**Input:** Validation request containing: property price, equity, loan duration, and selected mortgage tracks

**Logic:**
- Calculate LTV ratio — loan amount divided by property price
- Check LTV against maximum allowed ratio per Bank of Israel rules — flag if exceeded
- Check loan duration — flag if exceeds maximum allowed years (e.g. 30 years)
- Check equity — flag if down payment exceeds property price
- Check mandatory track ratios if applicable — flag if selected mix violates required proportions
- Return full validation result with a flag and reason per violated rule

**Output:** `{ "is_valid": true, "violations": [{ "rule": "string", "reason": "string" }] }`

**Connects to:** sever/simulator/simulatorController.js, shared/models/seed/mortgageTracks.json

---

### formatCurrency.js

**Purpose:** Formats numeric values as currency strings.
**Output:** Formatted currency string (e.g. ₪ 1,250,000)

### formatDecimal.js

**Purpose:** Formats numeric values to exactly one decimal place (XX.X format).
**Output:** Formatted decimal string (e.g. 4.5, 312.7)

### auth.js

**Purpose:** Handles user login, signup, and session verification.

**Logic:**
- On signup — validate credentials, hash password, create user record in DB, return auth token
- On login — verify credentials against stored record, return auth token on success
- On protected route access — verify auth token from request header; reject with 401 if invalid or missing
- Export middleware function for use by all route files that require verified identity

### navbar.js

**Purpose:** Renders the shared navigation bar across all pages.

**Logic:**
- Render navigation links to: Home (bot), Simulator, and Profile
- Highlight the currently active page link
- If user is logged in — show profile link as active/accessible
- If guest — profile link visible but indicates login required on click

### disclaimerBox.js

**Purpose:** Renders the legal/financial disclaimer box. Used by the bot feature when advisory intent is detected and by the simulator as a permanent disclaimer banner.

**Logic:**
- On show trigger received — make disclaimer box visible with appropriate text variant
- On hide trigger received — hide disclaimer box
- Render correct disclaimer text based on variant passed by parent

---

## Models

### UserProfile.js

**Schema fields:**
- `user_id` — unique, required, linked to auth identity
- `net_income` — numeric, optional
- `equity` — numeric, optional
- `monthly_savings` — numeric, optional
- `household_size` — positive integer, optional
- `created_at` — timestamp, auto-generated
- `updated_at` — timestamp, auto-updated

**Constraint:** Uniqueness on `user_id` — one profile per user

---

### GlossaryTerm.js

**Schema fields:**
- `term` — string, unique, required
- `definition` — string, required
- `related_terms` — array of strings, optional
- `created_at` — timestamp, auto-generated

---

### UsageCounter.js

**Schema fields:**
- `feature` — string, required (e.g. "simulator", "bot-chip")
- `identifier` — string, optional (e.g. chip label name)
- `count` — integer, incremented on each event
- `last_updated` — timestamp, auto-updated

---

### InterestRate.js

**Schema fields:**
- `track` — string, unique, required (e.g. "Prime", "Fixed Linked")
- `rate` — numeric, required
- `last_updated` — timestamp, auto-updated on each sync

---

### GuardrailLog.js

**Schema fields:**
- `classifier_category` — string, required (EDUCATION / ADVISORY / OUT_OF_DOMAIN / AMBIGUOUS)
- `rule_filter_decision` — string, required (ALLOW / ADVISORY_BLOCK / DOMAIN_BLOCK)
- `timestamp` — auto-generated

**Constraint:** No personal data stored — no user ID, no query text, no session data

---

## Seed Data

### glossary.json

Initial approved mortgage glossary term definitions. Format:
```json
[
  {
    "term": "Prime Interest",
    "definition": "The base interest rate set by the Bank of Israel...",
    "related_terms": ["Fixed Interest", "LTV"]
  }
]
```

### mortgageTracks.json

Defines all available mortgage track types, their behaviors, and rules. Format:
```json
[
  {
    "track": "Prime",
    "type": "variable",
    "linked": false,
    "max_ratio": 0.33,
    "behavior": "Tracks Bank of Israel prime rate with a fixed spread"
  }
]
```

### guardrailRules.json

Advisory keyword list and out-of-domain blocklist. Format:
```json
{
  "advisory_keywords": ["recommend", "best for me", "should I take"],
  "domain_blocklist": ["politics", "recipe", "weather", "sports"]
}
```

---

## Config Files

### .env

Required environment variables:
- `PORT` — server port number
- `MONGODB_URI` — MongoDB connection string
- `AUTH_SECRET` — JWT token secret
- `AUTH_EXPIRY` — token expiry duration
- `MAIN_LLM_API_KEY` — main LLM API key
- `MAIN_LLM_ENDPOINT` — main LLM API endpoint
- `CLASSIFIER_LLM_API_KEY` — lightweight classifier API key
- `CLASSIFIER_LLM_ENDPOINT` — classifier API endpoint
- `BOI_API_KEY` — Bank of Israel API key
- `BOI_API_ENDPOINT` — Bank of Israel API endpoint
- `PDF_SIZE_LIMIT` — maximum PDF file size in bytes

---

## System Prompt

**ROLE:** Multi-disciplinary assistant for the "Mortgage Assistant" project. Acts as developer, product manager, UX designer, or QA engineer depending on what the team needs.

**RULES:**
1. The spec is the source of truth. If the answer is there, follow it. If something conflicts with it, flag it.
2. Do not invent. Do not add features, fields, or behaviors not in the spec without clearly flagging them as proposals.
3. Respect scope. Every feature and file has a defined job — do not blur the lines.
4. Think like the user. If something would confuse, overwhelm, or pressure her, push back and propose a better option.
5. Be direct. Give a clear answer, explain your reasoning briefly, then get to the point.

**NOT ALLOWED:**
- Give personal financial advice or let the Bot do so — the product is educational, not advisory.
- Guess when uncertain — flag it and suggest where to find the right answer.
