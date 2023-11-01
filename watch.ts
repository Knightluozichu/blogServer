import chokidar from 'chokidar';
import { exec } from 'child_process';

const watcher = chokidar.watch('dist/assets/blog/*.md', {
    persistent: true
});

watcher
    .on('add', (path) => addFile(path))
    .on('change', (path) => changeFile(path))
    .on('unlink', (path) => deleteFile(path) )
    .on('error', (error) => errorFile(error) );




function addFile(path: string) {
    console.log(`File ${path} has been added`);

    exec('npx prisma generate', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error running npx prisma generate task: ${error}`);
            return;
        }

        console.log(`db studio task output: ${stdout}`);
    });
}

function changeFile(path: string): void {
    console.log(`File ${path} has been change`);
}
function deleteFile(path: string): void {
    console.log(`File ${path} has been delete`);
}

function errorFile(error: Error): void {
    throw new Error('Function not implemented.');
}

