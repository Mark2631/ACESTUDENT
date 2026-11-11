import { Brand } from "@/components/app-shell";

export default function Loading(){
  return <div className="app-frame" aria-busy="true" aria-label="Loading Ace Student">
    <aside className="sidebar">
      <Brand/>
      <div className="nav-section">Workspace</div>
      <div className="nav-list">
        <div className="skeleton skeleton-nav"/>
        <div className="skeleton skeleton-nav"/>
        <div className="skeleton skeleton-nav"/>
        <div className="skeleton skeleton-nav"/>
        <div className="skeleton skeleton-nav"/>
      </div>
      <div className="sidebar-footer"><div className="skeleton skeleton-line" style={{width:"55%"}}/><div className="skeleton skeleton-line" style={{width:"82%"}}/></div>
    </aside>
    <div className="app-main">
      <header className="topbar"><div className="skeleton skeleton-line" style={{width:160}}/><div className="skeleton skeleton-search"/></header>
      <main className="content">
        <section className="welcome-panel skeleton-hero">
          <div className="welcome-copy">
            <div className="skeleton skeleton-line" style={{width:110}}/>
            <div className="skeleton skeleton-title"/>
            <div className="skeleton skeleton-line" style={{width:"86%"}}/>
            <div className="skeleton skeleton-line" style={{width:"67%"}}/>
          </div>
        </section>
        <div className="section">
          <div className="skeleton skeleton-section-title"/>
          <div className="document-list">
            <div className="skeleton skeleton-card"/>
            <div className="skeleton skeleton-card"/>
            <div className="skeleton skeleton-card"/>
          </div>
        </div>
      </main>
    </div>
  </div>;
}