source "https://rubygems.org"

# Built by the GitHub Actions workflow in .github/workflows/pages.yml,
# so any plugin works (no GitHub Pages allowlist).
gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-seo-tag", "~> 2.8"     # page titles, descriptions, social cards
  gem "jekyll-sitemap", "~> 1.4"     # sitemap.xml for search engines
  gem "jekyll-scholar", "~> 7.3"     # publications from _bibliography/papers.bib
end

# Link checker run by the workflow after each build
gem "html-proofer", "~> 5.0"

# Needed for `jekyll serve` on Ruby 3+
gem "webrick", "~> 1.8"
