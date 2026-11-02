"""akademi.html'i parçalardan üretir: a.html iskeleti + a.css + [0-9]-*.js.

Kullanım:  python3 akademi-kaynak/build.py
Çıktı:     site/akademi.html
"""
import glob
import os

d = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(d, 'a.html'), encoding='utf-8').read()
css = open(os.path.join(d, 'a.css'), encoding='utf-8').read()
js = ''.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(d, '[0-9]-*.js'))))
out = html.replace('/*CSS*/', css).replace('/*JS*/', js)
target = os.path.join(d, '..', 'site', 'akademi.html')
open(target, 'w', encoding='utf-8').write(out)
print(os.path.normpath(target), len(out))
