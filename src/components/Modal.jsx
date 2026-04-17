function Modal({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Подтверждение</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Закрыть"></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Отмена</button>
            <button type="button" className="btn btn-primary" onClick={onConfirm}>Подтвердить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;