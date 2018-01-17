# Conversion script to change sixpack codebase to constructor codebase
perl -pi -e 's/sixpack/ConstructorioAB/g' sixpack.js
perl -pi -e 's|http://localhost:5001|https://ab.cnstrc.com|g' sixpack.js
mv sixpack.js constructorio-ab.js
mv mocha/sixpack-test.js mocha/constructorio-ab-test.js
