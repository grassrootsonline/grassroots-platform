export default function CheckEmailLoading() {
  return (
    <div className="panel-page">
      <div className="skeleton" style={{ width: 120, height: 28 }} />
      <div className="panel">
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto' }} />
        <div className="skeleton" style={{ width: '60%', height: 24, margin: '0 auto' }} />
        <div className="skeleton" style={{ width: '90%', height: 16 }} />
        <div className="skeleton" style={{ width: '70%', height: 16 }} />
      </div>
    </div>
  );
}
