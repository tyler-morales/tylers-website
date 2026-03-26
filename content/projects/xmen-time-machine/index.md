---
title: "X-Men Time Machine"
date: 2026-03-26
description: "Companion project to the Burger King X-Men Mini CD-ROM restoration: digital preservation and the story behind rescuing a 2001 promo disc."
featured_image: "xmen-cds.webp"
featured_image_alt: "Three Burger King X-Men Evolution promotional mini CDs: Wolverine, Nightcrawler, and Magneto."
status: "In progress"
year: 2026
tags: ["Retrocomputing", "Digital preservation", "Emulation"]
link_title: "Restoration write-up"
link_url: "/blog/digital-archaeology-burger-king-xmen/"
role: "Designer & developer"
comments: true
---

This page is a **project hub** for [the Burger King X-Men Mini CD-ROM restoration](/blog/digital-archaeology-burger-king-xmen/): how the disc was dumped, converted to an ISO, and run in a Windows XP guest (UTM) on Apple Silicon.

An earlier experiment with in-browser **v86** on this page was removed; running the promo reliably belongs in a full VM. The write-up covers the toolchain (MODE1/2352, `bchunk`, UTM) and what the experience taught about digital archaeology.

`tools/vm-setup/` in the repo still documents optional local assets (BIOS, disk images, ISOs) if you are experimenting with v86 or similar tooling offline.
