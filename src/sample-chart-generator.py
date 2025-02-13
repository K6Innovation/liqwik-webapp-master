import matplotlib.pyplot as plt

# Updated sample data
assets = ['LQ1', 'LQ2', 'LQ3', 'LQ4', 'LQ5', 'LQ6']
values = [2500, 5000, 7500, 3000, 6500, 10000]

# Create the bar chart without the title
plt.figure(figsize=(8, 6))
plt.bar(assets, values, color='skyblue')

# Add labels
plt.xlabel('Assets')
plt.ylabel('Value in Euros')

# Show the plot
plt.savefig('../public/assets_bar_chart.png')
plt.show()
