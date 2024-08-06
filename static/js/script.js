document.addEventListener("DOMContentLoaded", function () {
  const analyzeBtn = document.getElementById("analyze-btn");
  const loadingSection = document.getElementById("loading-section");
  const resultsSection = document.getElementById("results-section");
  const suggestion1 = document.getElementById("suggestion1");
  const suggestion2 = document.getElementById("suggestion2");
  const finalSuggestion = document.getElementById("final-suggestion");

  analyzeBtn.addEventListener("click", function () {
    const productUrl1 = document.getElementById("productUrl1").value;
    const productUrl2 = document.getElementById("productUrl2").value;

    loadingSection.style.display = "block";
    resultsSection.style.display = "none";

    fetch("/analyze-sentiment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productUrls: [productUrl1, productUrl2],
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          // Display error message
          finalSuggestion.textContent = data.error;
        } else {
          // Update charts with sentiment data
          updateChart("chart1", data.results[0]);
          updateChart("chart2", data.results[1]);
          // Generate suggestions for each product
          suggestion1.textContent = generateSuggestion(data.results[0]);
          suggestion2.textContent = generateSuggestion(data.results[1]);
          // Generate final suggestion
          finalSuggestion.textContent = generateFinalSuggestion(data.results);
        }

        loadingSection.style.display = "none";
        resultsSection.style.display = "block";
      })
      .catch((error) => {
        console.error("Error:", error);
        finalSuggestion.textContent = "An error occurred while fetching data.";
        loadingSection.style.display = "none";
        resultsSection.style.display = "block";
      });
  });

  function updateChart(chartId, data) {
    const chartElement = document.getElementById(chartId);
    chartElement.innerHTML = ""; // Clear previous chart
    new Chart(chartElement, {
      type: "pie",
      data: {
        labels: ["Positive", "Negative", "Neutral"],
        datasets: [
          {
            label: "Sentiment Analysis",
            backgroundColor: ["green", "red", "blue"],
            data: [data.positive || 0, data.negative || 0, data.neutral || 0],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        cutoutPercentage: 50,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  function generateSuggestion(sentimentData) {
    const totalReviews =
      (sentimentData.positive || 0) +
      (sentimentData.negative || 0) +
      (sentimentData.neutral || 0);
    const positivePercentage =
      ((sentimentData.positive || 0) / totalReviews) * 100;
    const negativePercentage =
      ((sentimentData.negative || 0) / totalReviews) * 100;

    if (positivePercentage >= 60) {
      return "Based on the positive sentiment of the reviews, these products seem to be well-received by customers. You can confidently consider purchasing them.";
    } else if (negativePercentage >= 40) {
      return "The negative sentiment in the reviews indicates some issues with these products. It's advisable to read the negative reviews carefully before making a decision.";
    } else {
      return "The reviews for these products have mixed sentiments, indicating varying experiences. It's recommended to explore further and consider individual factors before deciding.";
    }
  }

  function generateFinalSuggestion(results) {
    const totalPositivePercentage1 =
      ((results[0].positive || 0) /
        ((results[0].positive || 0) +
          (results[0].negative || 0) +
          (results[0].neutral || 0))) *
      100;
    const totalPositivePercentage2 =
      ((results[1].positive || 0) /
        ((results[1].positive || 0) +
          (results[1].negative || 0) +
          (results[1].neutral || 0))) *
      100;

    if (totalPositivePercentage1 > totalPositivePercentage2) {
      return "Based on the overall positive sentiment of the reviews, Product 1 seems to be better received by customers.";
    } else if (totalPositivePercentage2 > totalPositivePercentage1) {
      return "Based on the overall positive sentiment of the reviews, Product 2 seems to be better received by customers.";
    } else {
      return "Both products have similar overall positive sentiment in the reviews.";
    }
  }
});
