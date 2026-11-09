export default function UndoToast({ product, onUndo }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {product && (
        <div className="toast">
          <span>Deleted “{product.name}”.</span>
          <button type="button" onClick={onUndo}>
            Undo
          </button>
        </div>
      )}
    </div>
  )
}