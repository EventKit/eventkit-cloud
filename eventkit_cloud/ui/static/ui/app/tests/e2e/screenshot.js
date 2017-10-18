
const width = 1280;
const height = 720;


module.exports = {
    // Adjust resolution for Windows 10 / Chrome 61.0 bezel.
    get width() {
        return width + 16;
    },

    get height() {
        return height + 93;
    }
};
