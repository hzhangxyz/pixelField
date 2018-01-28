# Pixel Field

大概就是模仿/r/place做的一个无限大版本的东西...

# 问题

- savePeriod 也许可以大一点?
- 貌似write比read慢..也许db里的data不应该按照时间排序了
- 服务器的那个O(n^2)的东西算得时间太长貌似lock相关的东西会出bug,也许可以模仿client写个tmp
