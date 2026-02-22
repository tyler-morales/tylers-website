---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
slug: "{{ .File.ContentBaseName }}"
date: {{ .Date.Format "2006-01-02" }}
author: ""
description: ""
summary: ""
tags: []
draft: true
featured_image: "feature.jpg"
featured_image_alt: ""
featured_image_caption: ""
comments: true
---

# "{title}"