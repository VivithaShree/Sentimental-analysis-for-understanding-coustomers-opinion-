from flask import Flask, request, jsonify, render_template
from bs4 import BeautifulSoup
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk
import requests
import emoji

app = Flask(__name__)

nltk.download('vader_lexicon')

def preprocess_text(text):
    return emoji.demojize(text) 

def sentiment_vader(text):
    print(text)
    sid = SentimentIntensityAnalyzer()
    polarity_scores = sid.polarity_scores(text)
    if polarity_scores['compound'] >= 0.05: 
        return "positive"
    elif polarity_scores['compound'] <= -0.05:
        return "negative"
    else:
        return "neutral"

def scrape_flipkart_reviews(url, max_pages=10):
    all_reviews = []
    page = 1
    while page <= max_pages:
        response = requests.get(url.format(page))
        content = response.content
        soup = BeautifulSoup(content, 'html.parser')
        review_divs = soup.find_all('div', class_='ZmyHeo')
        if not review_divs:
            break
        reviews = [preprocess_text(review_div.get_text().strip()) for review_div in review_divs]
        all_reviews.extend(reviews)
        page += 1
    return all_reviews

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    product_urls = data.get('productUrls', [])
    
    if not product_urls or len(product_urls) != 2:
        return jsonify({"error": "Please provide two product URLs"})
    
    results = []
    for url in product_urls:
        if 'flipkart.com' not in url:
            return jsonify({"error": f"Invalid URL for Flipkart: {url}"})
        
        try:
            reviews = scrape_flipkart_reviews(url)
            sentiment_data = {"positive": 0, "negative": 0, "neutral": 0}
            for review in reviews:
                sentiment = sentiment_vader(review)
                sentiment_data[sentiment] += 1
            results.append(sentiment_data)
        except Exception as e:
            return jsonify({"error": f"Error processing URL {url}: {str(e)}"})
    
    return jsonify({"results": results})


if __name__ == '__main__':
    app.run(debug=True)
