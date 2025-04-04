import { Elysia, t } from 'elysia'
import { spawnSync } from "child_process";


let revision: number;

function svnUpdate() {
  spawnSync('svn', [ 'up', `${process.env.HOME}/${process.env.ACTIVE_BRANCH}` ], {
    stdio: 'inherit'
  });
  revision = checkCurrentCommit();
}
const checkCurrentCommit = () => {
  const currentCommit = spawnSync('svn', [ 'info', '--show-item', 'revision', '--no-newline', `${process.env.HOME}/${process.env.ACTIVE_BRANCH}` ]);
  
  if (currentCommit.stdout) {
    const commit = Number.parseInt(currentCommit.stdout.toString().trim());
    if (commit && !Number.isNaN(commit)) {
      return commit;
    }
  }
  return 0;
}

const updateIfNeeded = () => {
  const currentCommit = checkCurrentCommit();
  if (currentCommit && !Number.isNaN(currentCommit) && currentCommit < revision) {
    svnUpdate();
  }
  return revision > 0 ? `Version actual: ${revision}` : 'Error al obtener la versión';
}


const app = new Elysia()
  .get("/", () => "En espera")
  .put('/trigger', async ({ body: { commit } }) => {
    //discard not digits
    commit = commit.replace(/[^0-9]/g, '');
    const commitNumerico = Number.parseInt(commit);
    let message: string | undefined;
    if(Number.isNaN(commitNumerico) || commitNumerico <= 0) {
      message = 'El commit no es un número válido';
    }
    if(commitNumerico > 1000000 || commitNumerico < revision) {
      message = 'Version ignorada';
    }
    revision = commitNumerico;
    message = updateIfNeeded();
    return message;
  }, {
    body: t.Object({
      commit: t.String()
    })
  }) 
  .listen(3050);

console.log(
  `En espera de solicitudes en http://${app.server?.hostname}:${app.server?.port}`
);

