#!/usr/bin/env python3
"""
generate_visualizations.py - Create interactive visualizations from government spending data

This script loads the budget_by_function.json data, processes it, and generates
interactive visualizations using Plotly. The visualizations are saved as HTML files
that can be embedded in a web page.
"""

import json
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime

# Create output directory if it doesn't exist
os.makedirs('visualizations', exist_ok=True)

# Load the data
print("Loading data...")
with open('../data/budget_by_function.json', 'r') as f:
    raw_data = json.load(f)

# Process the data
print("Processing data...")

# Extract quarters and years
quarters = list(raw_data.keys())
years = sorted(list(set([q[:4] for q in quarters])))

# Function to process data into yearly totals
def process_yearly_data():
    yearly_data = {}

    for quarter, items in raw_data.items():
        year = quarter[:4]

        if year not in yearly_data:
            yearly_data[year] = {}

        for item in items:
            category = item['name']
            amount = item['amount']

            if category not in yearly_data[year]:
                yearly_data[year][category] = 0

            yearly_data[year][category] += amount

    # Calculate yearly totals
    for year in yearly_data:
        yearly_data[year]['Total'] = sum(
            amount for category, amount in yearly_data[year].items()
            if category != 'Unreported Data' and category != 'Governmental Receipts'
        )

    return yearly_data

# Function to process quarterly data
def process_quarterly_data():
    quarterly_data = {}

    for quarter, items in raw_data.items():
        quarterly_data[quarter] = {}

        for item in items:
            category = item['name']
            amount = item['amount']
            quarterly_data[quarter][category] = amount

        # Calculate quarterly total
        quarterly_data[quarter]['Total'] = sum(
            amount for category, amount in quarterly_data[quarter].items()
            if category != 'Unreported Data' and category != 'Governmental Receipts'
        )

    return quarterly_data

# Process data
yearly_data = process_yearly_data()
quarterly_data = process_quarterly_data()

# Get all categories
all_categories = set()
for quarter, items in raw_data.items():
    for item in items:
        all_categories.add(item['name'])

# Remove special categories
categories = [cat for cat in all_categories if cat not in ('Unreported Data', 'Governmental Receipts')]

# Sort categories by average spending
def get_category_avg(category):
    total = 0
    count = 0
    for year in years:
        if category in yearly_data[year]:
            total += yearly_data[year][category]
            count += 1
    return total / max(1, count)

top_categories = sorted(categories, key=get_category_avg, reverse=True)[:10]

# Format large numbers
def format_amount(amount):
    if amount >= 1e12:
        return f"${amount/1e12:.1f}T"
    elif amount >= 1e9:
        return f"${amount/1e9:.1f}B"
    elif amount >= 1e6:
        return f"${amount/1e6:.1f}M"
    else:
        return f"${amount:.0f}"

print("Generating visualizations...")

# 1. Total Spending Visualization
print("Creating Total Spending visualization...")

# Prepare data for total spending
total_spending_data = []
for year in years:
    total_spending_data.append({
        'Year': year,
        'Total Spending': yearly_data[year]['Total']
    })

total_spending_df = pd.DataFrame(total_spending_data)

# Create the visualization
fig_total = px.bar(
    total_spending_df,
    x='Year',
    y='Total Spending',
    title='Total U.S. Government Spending by Year',
    labels={'Total Spending': 'Total Spending (USD)'},
    color_discrete_sequence=['#1f77b4']
)

# Customize layout
fig_total.update_layout(
    plot_bgcolor='white',
    font=dict(family='Arial, sans-serif', size=14),
    hoverlabel=dict(bgcolor='white', font_size=14),
    xaxis=dict(title='Fiscal Year', tickangle=0),
    yaxis=dict(
        title='Total Spending (USD)',
        tickformat='$,.0f',
        gridcolor='#eee'
    ),
    margin=dict(t=50, b=80, l=80, r=50),
    height=500
)

# Add custom data for JavaScript interactivity
fig_total.update_traces(
    customdata=total_spending_df['Year'].tolist(),
    hovertemplate='Year: %{x}<br>Total Spending: %{y:$,.0f}'
)

# Add HTML buttons and interactivity
fig_total.update_layout(
    updatemenus=[
        dict(
            type="buttons",
            direction="right",
            x=0.7,
            y=1.15,
            buttons=[
                dict(
                    label="Total",
                    method="update",
                    args=[{"visible": [True]}, {"title": "Total U.S. Government Spending by Year"}]
                ),
                dict(
                    label="Per Capita",
                    method="update",
                    args=[{"visible": [True]}, {"title": "Per Capita U.S. Government Spending by Year"}]
                )
            ]
        )
    ],
    annotations=[
        dict(
            text="Click on a bar to see category breakdown",
            x=0.5,
            y=-0.15,
            xref="paper",
            yref="paper",
            showarrow=False
        )
    ]
)

# Save the figure as an HTML file
fig_total.write_html(
    '../visualizations/total_spending.html',
    include_plotlyjs='cdn',
    full_html=False,
    config={'responsive': True, 'displayModeBar': True}
)

# 2. Category Breakdown Visualization
print("Creating Category Breakdown visualization...")

# Prepare data for category breakdown
category_data = []
for year in years:
    for category in top_categories:
        if category in yearly_data[year]:
            category_data.append({
                'Year': year,
                'Category': category,
                'Amount': yearly_data[year][category],
                'Percentage': yearly_data[year][category] / yearly_data[year]['Total'] * 100
            })

category_df = pd.DataFrame(category_data)

# Create a treemap visualization for the latest year as initialization
latest_year = years[-1]
latest_year_df = category_df[category_df['Year'] == latest_year]

fig_categories = px.treemap(
    latest_year_df,
    path=['Category'],
    values='Amount',
    color='Amount',
    color_continuous_scale='Viridis',
    # title=f'U.S. Government Spending by Category ({latest_year})',
    hover_data=['Percentage']
)

# Add custom data for JavaScript interactivity
fig_categories.update_traces(
    hovertemplate='<b>%{label}</b><br>Amount: %{value:$,.0f}<br>Percentage: %{customdata[0]:.1f}%',
    texttemplate='<b>%{label}</b><br>%{value:$,.0f}'
)

# Add dropdown for year selection
years_list = years.copy()
buttons = []
for year in years_list:
    year_df = category_df[category_df['Year'] == year]

    # Convert the dataframe to a dict for use with update traces
    # This is to avoid the "DataFrame is not JSON serializable" error
    categories_for_year = year_df['Category'].tolist()
    values_for_year = year_df['Amount'].tolist()
    percentages_for_year = year_df['Percentage'].tolist()

    # Create a structure that matches what plotly expects
    update_data = {
        'path': [['Category'] + categories_for_year],
        'values': [values_for_year],
        'customdata': [[p] for p in percentages_for_year]
    }

    buttons.append(dict(
        label=year,
        method="update",
        args=[update_data, {"title": f"U.S. Government Spending by Category ({year})"}]
    ))

# fig_categories.update_layout(
#     updatemenus=[
#         dict(
#             buttons=buttons,
#             direction="down",
#             showactive=True,
#             x=0.1,
#             y=1.15
#         )
#     ],
#     annotations=[
#         dict(
#             text="Select Year:",
#             x=0,
#             y=1.15,
#             xref="paper",
#             yref="paper",
#             showarrow=False
#         )
#     ]
# )

# Customize layout
fig_categories.update_layout(
    font=dict(family='Arial, sans-serif', size=14),
    margin=dict(t=80, b=20, l=20, r=20),
    height=600
)

# Save the figure as an HTML file
fig_categories.write_html(
    '../visualizations/category_breakdown.html',
    include_plotlyjs='cdn',
    full_html=False,
    config={'responsive': True}
)

# 3. Spending Change Visualization
print("Creating Spending Change visualization...")

# Calculate year-over-year changes
change_data = []
for i, year in enumerate(years[1:], 1):
    prev_year = years[i-1]

    for category in top_categories:
        if category in yearly_data[year] and category in yearly_data[prev_year]:
            current = yearly_data[year][category]
            previous = yearly_data[prev_year][category]

            if previous > 0:  # Avoid division by zero
                change_data.append({
                    'Year': year,
                    'Category': category,
                    'Previous Year': prev_year,
                    'Absolute Change': current - previous,
                    'Percentage Change': (current - previous) / previous * 100
                })

change_df = pd.DataFrame(change_data)

# Get the most recent year
recent_year = years[-1]
recent_prev_year = years[-2]
recent_changes = change_df[change_df['Year'] == recent_year].sort_values('Absolute Change', ascending=False)

# Create a bar chart for absolute changes
fig_changes = px.bar(
    recent_changes,
    x='Category',
    y='Absolute Change',
    color='Percentage Change',
    color_continuous_scale='RdBu_r',
    color_continuous_midpoint=0,
    title=f'Spending Changes from {recent_prev_year} to {recent_year}',
    labels={'Absolute Change': 'Change in Spending (USD)'},
    custom_data=['Percentage Change']  # Pass as custom_data instead of hover_data
)

# Customize layout
fig_changes.update_layout(
    plot_bgcolor='white',
    font=dict(family='Arial, sans-serif', size=14),
    xaxis=dict(title='', tickangle=-45, categoryorder='total ascending'),
    yaxis=dict(
        title='Change in Spending (USD)',
        tickformat='$,.0f',
        gridcolor='#eee'
    ),
    coloraxis_colorbar=dict(
        title='% Change',
        ticksuffix='%'
    ),
    margin=dict(t=50, b=100, l=80, r=50),
    height=600
)

# Add custom data for JavaScript interactivity
fig_changes.update_traces(
    hovertemplate='<b>%{x}</b><br>Change: %{y:$,.0f}<br>Percentage: %{customdata:.1f}%',
)

# Add dropdown for year selection
year_buttons = []
for i, year in enumerate(years[1:], 1):
    prev_year = years[i-1]

    # Get data for this year pair
    year_changes = change_df[change_df['Year'] == year].sort_values('Absolute Change', ascending=False)

    if not year_changes.empty:
        # Convert to lists to avoid DataFrame serialization issues
        categories = year_changes['Category'].tolist()
        abs_changes = year_changes['Absolute Change'].tolist()
        pct_changes = year_changes['Percentage Change'].tolist()

        year_buttons.append(
            dict(
                label=f"{prev_year} to {year}",
                method="update",
                args=[
                    {
                        "x": [categories],
                        "y": [abs_changes],
                        "customdata": [pct_changes]
                    },
                    {"title": f"Spending Changes from {prev_year} to {year}"}
                ]
            )
        )

fig_changes.update_layout(
    updatemenus=[
        dict(
            buttons=year_buttons,
            direction="down",
            showactive=True,
            x=0.1,
            y=1.15
        )
    ],
    annotations=[
        dict(
            text="Select Years:",
            x=0,
            y=1.15,
            xref="paper",
            yref="paper",
            showarrow=False
        )
    ]
)

# Save the figure as an HTML file
fig_changes.write_html(
    '../visualizations/spending_changes.html',
    include_plotlyjs='cdn',
    full_html=False,
    config={'responsive': True}
)

print("All visualizations have been generated successfully!")
print("The HTML files are in the 'visualizations' directory and can be embedded in your website.")
