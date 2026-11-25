s=open('engine.js').read()
s=s.replace("if (typeof module !== 'undefined' && module.exports) module.exports = API;","return API;")
s=s.replace("'use strict';\n","",1)
eng="const E = (function(){\n'use strict';\n"+s+"\n})();"
t=open('ui_template.html').read()
open('index.html','w').write(t.replace("/*__ENGINE__*/",eng))
print(len(open('index.html').read()))
