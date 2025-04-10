# U.S. Government Spending Visualization

An interactive web visualization of U.S. Government spending data from 2018-2024, created for DATASCI 209 Final Project.

## Project Overview

This project visualizes U.S. Government spending data, allowing users to explore overall spending trends, category breakdowns, and the impact of major events like COVID-19, the Ukraine War, and inflation.

## File Structure

```
project/
│
├── data/
│   └── budget_by_function.json       # Raw data from USAspending.gov
│
├── python/
│   ├── generate_visualizations.py    # Python script to generate visualizations
│   └── requirements.txt              # Python dependencies
│
├── visualizations/                   # Output directory for generated visualizations
│   ├── total_spending.html
│   ├── category_breakdown.html
│   └── spending_changes.html
│
├── js/
│   ├── main.js                       # Core functionality (Person 1)
│   ├── visualization1.js             # Total spending visualization (Person 1)
│   ├── visualization2.js             # Category breakdown visualization (Person 1)
│   ├── visualization3.js             # Spending changes visualization (Person 1)
│   ├── visualization4.js             # To be implemented by Person 2
│   ├── visualization5.js             # To be implemented by Person 2
│   └── visualization6.js             # To be implemented by Person 2
│
├── css/
│   └── styles.css                    # Styling (Person 3)
│
└── index.html                        # Main HTML file (Person 3)
```

## Getting Started

### Prerequisites

- Python 3.7 or higher
- Web browser (Chrome, Firefox, Safari, or Edge)
- Local web server for development (optional but recommended)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd us-government-spending-visualization
   ```

2. Install Python dependencies:
   ```
   pip install -r python/requirements.txt
   ```

3. Generate the visualizations:
   ```
   python python/generate_visualizations.py
   ```

4. Serve the project locally:
   - You can use Python's built-in HTTP server:
     ```
     python -m http.server
     ```
     Then copy and paste this into your browser: http://localhost:8000/
   - Or open `index.html` directly in a browser (some features may not work due to cross-origin restrictions)

## Development Workflow

### Person 1 (JavaScript & Data Handling – 3 Plots)

Your responsibilities:
- Implement functionality in `main.js` to load and process data
- Create the following visualizations:
  - Total spending visualization (`visualization1.js`)
  - Category breakdown visualization (`visualization2.js`)
  - Spending changes visualization (`visualization3.js`)
- Add user interactions (tooltips, click-to-filter, legend toggles)
- Optimize performance

### Person 2 (JavaScript & UI Interactions – 3 Plots)

Your responsibilities:
- Implement the remaining visualizations:
  - Visualization4 (e.g., Cumulative change)
  - Visualization5 (e.g., Impactful events - COVID)
  - Visualization6 (e.g., Impactful events - Ukraine/Inflation)
- Handle complex user interactions (linked charts, filtering)
- Debug and optimize rendering performance
- Maintain consistent visualization style with Person 1

### Person 3 (HTML/CSS & Integration)

Your responsibilities:
- Enhance the website design using HTML/CSS
- Make sure the layout is responsive
- Integrate all JavaScript visualizations
- Set up a live server for testing
- Handle styling tweaks and UI interactions

## How It Works

This project uses a hybrid approach:

1. Python (Plotly) generates the base interactive visualizations
2. JavaScript coordinates interactions between these visualizations
3. The visualizations are embedded as iframes in the website
4. Messages are passed between the iframes and the main page to enable interactivity

## Deployment

For the final project, you'll need to deploy the website to the I School webspace. Follow the instructions provided in the course materials for deploying to the I School server.

## Data Source

The data comes from [USAspending.gov](https://www.usaspending.gov/), the official source for U.S. government spending data.
