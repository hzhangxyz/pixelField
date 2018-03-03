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
- ws丢失的时候重新连
- 改变ws的url并改变本地数据结构，加一个ws url的索引
- 多进程
- save on close web page
