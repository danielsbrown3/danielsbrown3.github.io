---
layout: post
title: "Your Blog Post Title"
date: 2024-01-01 12:00:00 +0000
tags: [jekyll, github-pages, web-development]
description: "A brief description of your blog post that will appear in meta tags and previews."
reading_time: 5
---

# Introduction

This is a template for creating blog posts on your Jekyll site. It demonstrates various Markdown formatting options and how to use Liquid templating.

## Basic Text Formatting

This is a paragraph with some **bold** and *italic* text. You can also use `inline code` for technical terms.

### Lists

#### Unordered List
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

#### Ordered List
1. First step
2. Second step
   1. Sub-step
   2. Another sub-step
3. Third step

### Code Blocks

```python
def hello_world():
    print("Hello, World!")
    return True
```

### Images

![Alt text for image]({{ site.baseurl }}/assets/images/example.jpg "Optional title")

### Blockquotes

> This is a blockquote. It's great for highlighting important quotes or excerpts from other sources.

### Links

- [Internal link to another post]({{ site.baseurl }}/posts/another-post)
- [External link](https://example.com)

## Using Liquid Templates

You can reference site variables like this:
- Site title: {{ site.title }}
- Site description: {{ site.description }}

## Conclusion

This template shows you how to format your blog posts effectively. Remember to:
1. Update the front matter with your post's details
2. Use proper heading hierarchy
3. Include relevant tags
4. Add a reading time estimate

Happy blogging! 