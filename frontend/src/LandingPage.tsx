import { ArrowDown, ArrowRight, Blocks, Code2, FolderKanban, ListTodo, Sparkles } from 'lucide-react'
import DevForgeLogo from './DevForgeLogo'

export default function LandingPage({ onOpenWorkspace, onSignIn }: { onOpenWorkspace: () => void; onSignIn: () => void }) {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <img className="landing-photo" src="/devforge-hero.png" alt="A warm developer workspace with a laptop displaying code" />
        <div className="landing-image-shade" />
        <header className="landing-nav">
          <a className="landing-brand" href="#top" aria-label="DevForge home"><DevForgeLogo /></a>
          <nav aria-label="Main navigation"><a href="#features">Features</a><a href="#workflow">Workflow</a></nav>
          <div className="landing-nav-actions"><button className="landing-nav-signin" type="button" onClick={onSignIn}>Sign in</button><button className="landing-nav-cta" type="button" onClick={onOpenWorkspace}>Open workspace <ArrowRight size={15} /></button></div>
        </header>
        <div className="landing-copy" id="top">
          <div className="landing-kicker"><Sparkles size={14} /> A DEVELOPER'S SPACE</div>
          <h1>Build. Organize.<br />Code. Grow.</h1>
          <p>Projects, tasks, code snippets and source files, together in one calm workspace for the things you are building.</p>
          <div className="landing-actions"><button className="landing-primary" type="button" onClick={onOpenWorkspace}>Open workspace <ArrowRight size={16} /></button><a className="landing-secondary" href="#features">Explore the workspace <ArrowDown size={15} /></a></div>
        </div>
        <aside className="landing-product-preview" aria-label="Illustrative DevForge workspace preview">
          <div className="preview-window-bar"><div className="preview-window-dots"><i /><i /><i /></div><span>DEVFORGE <b>/</b> WORKSPACE PREVIEW</span><span className="preview-window-icon"><Code2 size={14} /></span></div>
          <div className="preview-project-heading"><div><span className="preview-overline">PROJECT SPACE</span><h2>DevForge MVP</h2><p>One home for the work in progress.</p></div><span className="preview-state"><i /> MVP</span></div>
          <div className="preview-workspace-grid">
            <div className="preview-code-panel">
              <div className="preview-panel-heading"><span><Code2 size={13} /> Hello.java</span><small>JAVA</small></div>
              <pre><span>1</span> <b>public class</b> Hello {'{'}<br /><span>2</span>   <b>public static void</b> main(String[] args) {'{'}<br /><span>3</span>     System.out.println(<em>"Hello, DevForge!"</em>);<br /><span>4</span>   {'}'}<br /><span>5</span> {'}'}</pre>
            </div>
            <div className="preview-task-panel">
              <div className="preview-panel-heading"><span><ListTodo size={13} /> Task flow</span><small>3 STATES</small></div>
              <div className="preview-task-row"><i className="task-dot dot-coral" /><span>Set up project</span><small>TO DO</small></div>
              <div className="preview-task-row"><i className="task-dot dot-cyan" /><span>Shape the API</span><small>ACTIVE</small></div>
              <div className="preview-task-row"><i className="task-dot dot-lime" /><span>Ship the first slice</span><small>DONE</small></div>
            </div>
          </div>
          <div className="preview-foot"><span><FolderKanban size={13} /> Projects</span><span><Code2 size={13} /> Snippets</span><span><Blocks size={13} /> Source files</span><button type="button" onClick={onOpenWorkspace}>Open workspace <ArrowRight size={14} /></button></div>
        </aside>
        <div className="landing-proof"><span>MAKE ROOM FOR</span><div><FolderKanban size={16} /> Projects</div><div><ListTodo size={16} /> Task boards</div><div><Code2 size={16} /> Code library</div><div><Blocks size={16} /> Source files</div></div>
      </section>

      <section className="landing-features" id="features">
        <div className="features-heading"><div><p className="eyebrow">ONE WORKSPACE, FOUR TOOLS</p><h2>Keep the work moving.</h2></div><p>From a first idea to the code you want to keep, your project stays close at hand.</p></div>
        <div className="feature-grid" id="workflow">
          <article className="feature-item"><span className="feature-icon icon-gold"><FolderKanban size={19} /></span><h3>Projects</h3><p>Give each idea a home and keep its work in one place.</p><button type="button" onClick={onOpenWorkspace}>Explore projects <ArrowRight size={14} /></button></article>
          <article className="feature-item"><span className="feature-icon icon-coral"><ListTodo size={19} /></span><h3>Task board</h3><p>Move tasks from To do to In progress and Done.</p><button type="button" onClick={onOpenWorkspace}>View workspace <ArrowRight size={14} /></button></article>
          <article className="feature-item"><span className="feature-icon icon-lilac"><Code2 size={19} /></span><h3>Code library</h3><p>Save, find and share reusable code snippets.</p><button type="button" onClick={onOpenWorkspace}>Browse tools <ArrowRight size={14} /></button></article>
          <article className="feature-item"><span className="feature-icon icon-mint"><Blocks size={19} /></span><h3>Source files</h3><p>Group small code files and notes into collections.</p><button type="button" onClick={onOpenWorkspace}>Open workspace <ArrowRight size={14} /></button></article>
        </div>
        <footer className="landing-footer"><a className="landing-brand" href="#top" aria-label="DevForge home"><DevForgeLogo /></a><span>Made for the work in progress.</span><button type="button" onClick={onOpenWorkspace}>Enter your workspace <ArrowRight size={14} /></button></footer>
      </section>
    </main>
  )
}
