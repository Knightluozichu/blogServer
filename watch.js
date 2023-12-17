"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar_1 = __importDefault(require("chokidar"));
const child_process_1 = require("child_process");
const watcher = chokidar_1.default.watch('dist/assets/blog/*.md', {
    persistent: true
});
watcher
    .on('add', (path) => addFile(path))
    .on('change', (path) => changeFile(path))
    .on('unlink', (path) => deleteFile(path))
    .on('error', (error) => errorFile(error));
function addFile(path) {
    console.log(`File ${path} has been added`);
    (0, child_process_1.exec)('npx prisma generate', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error running npx prisma generate task: ${error}`);
            return;
        }
        console.log(`db studio task output: ${stdout}`);
    });
}
function changeFile(path) {
    console.log(`File ${path} has been change`);
}
function deleteFile(path) {
    console.log(`File ${path} has been delete`);
}
function errorFile(error) {
    throw new Error('Function not implemented.');
}
