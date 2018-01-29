[![Build Status](https://travis-ci.org/hzhangxyz/pixelField.svg?branch=master)](https://travis-ci.org/hzhangxyz/pixelField)

# Pixel Field

Infinite map version of /r/place

# Requirement

- nodejs
- mongodb

# Installation from Repo

```
npm install
npm run build
```

# Installation from Build

```
npm install --production
```

# Run

```
npm run start
```

# More detail

```
npm run help
```

# 问题

- data的数据结构从[{x,y,r,g,b,t},...] => {x:{y:{r,g,b,t},...},...} ?
- Tx_y可以单独在一个db里么,不和data混在一起
