import './PageHeading.css'

/**
 * Molécula: título + subtítulo de la vista, usado en el header.
 */
function PageHeading({ title, subtitle }) {
  return (
    <div className="page-heading">
      <h1 className="page-heading__title">{title}</h1>
      {subtitle && <p className="page-heading__subtitle">{subtitle}</p>}
    </div>
  )
}

export default PageHeading
