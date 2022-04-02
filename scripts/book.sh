# Shell script to copy the build directory and 
# view books on a local server

# Make sure assets are up to date
npm run build-dev

# Copy the build directory to the book's path
rm -r $1/build
mkdir -p $1/build
cp -r public/ $1/build

# Open a new browser tab, proxy to localhost, and disable caching
http-server $1/build -o -c-1