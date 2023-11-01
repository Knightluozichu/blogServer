import chokidar from 'chokidar';

const watcher = chokidar.watch('dist/assets/blog/*.doc', {
    persistent: true
});

watcher
    .on('add', (path) => addFile(path))
    .on('change', (path) => changeFile(path))
    .on('unlink', (path) => deleteFile(path) )
    .on('error', (error) => errorFile(error) );


function addFile(path: string) {
    console.log(`File ${path} has been added`);
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

