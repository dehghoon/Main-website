// Read-only cross-repository discovery. Never publishes releases or changes Core.
export function relevantPath(path) {
 return /^(src\/|schemas\/|catalogs\/|registry\/|releases\/|package\.json$|CORE_CONTRACT\.md$|LINKOTEQ_PLUGIN_MIGRATION_CONTRACT\.md$|docs\/CORE_)/.test(path);
}
export function changeKey(kind, id, sha) { return `command-center:core:${kind}:${id}:${sha}`; }
export async function discoverCoreChanges(github) {
 const repo={owner:'dehghoon',repo:'linkoteq-structural-core'};
 const [releases,tags,head,prs]=await Promise.all([
  github.paginate(github.rest.repos.listReleases,{...repo,per_page:100}),
  github.paginate(github.rest.repos.listTags,{...repo,per_page:100}),
  github.rest.repos.getCommit({...repo,ref:'main'}),
  github.paginate(github.rest.pulls.list,{...repo,state:'open',per_page:100})
 ]);
 const changes=[{kind:'source',id:'main',sha:head.data.sha,url:head.data.html_url}];
 for(const r of releases.filter(r=>!r.draft))changes.push({kind:'release',id:String(r.id),sha:r.tag_name,url:r.html_url});
 for(const t of tags)changes.push({kind:'tag',id:t.name,sha:t.commit.sha,url:`https://github.com/dehghoon/linkoteq-structural-core/tree/${t.commit.sha}`});
 for(const pr of prs){
  const files=await github.paginate(github.rest.pulls.listFiles,{...repo,pull_number:pr.number,per_page:100});
  if(files.some(f=>relevantPath(f.filename)))changes.push({kind:'interface-pr',id:String(pr.number),sha:pr.head.sha,url:pr.html_url});
 }
 return changes.map(c=>({...c,key:changeKey(c.kind,c.id,c.sha)}));
}
export async function openReviewTasks(github, context) {
 const changes=await discoverCoreChanges(github);
 const issues=await github.paginate(github.rest.issues.listForRepo,{...context.repo,state:'all',per_page:100});
 for(const change of changes){
  if(issues.some(i=>i.body?.includes(`<!-- ${change.key} -->`)))continue;
  await github.rest.issues.create({...context.repo,title:`Core compatibility review: ${change.kind} ${change.id}`,
   body:`<!-- ${change.key} -->\nSource: ${change.url}\nRevision: ${change.sha}\n\nReview in /admin/access-manager → Structural Core / Owner Approval Inbox.\n\nVerify all consumers in lib/command-center/repository-snapshot.json. Create per-tool migration issues for the responsible GPT-1–GPT-5 or tool agent only after source impact is verified.\n\nEach handoff must specify target Core, affected tool, migration, repository/branch, acceptance criteria, reference tests and deliverables.\n\nRequired evidence: unit, integration, regression, engineering reference, schema, security, build, preview, per-tool compatibility and rollback. No capability removal. No merge, release publication or production deployment without explicit Owner approval and green required checks.`});
 }
 return changes;
}
