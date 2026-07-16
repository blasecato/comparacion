import { useMemo, useState } from 'react'
import { Button } from 'antd'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  TableOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import SummaryCard from '../../molecules/SummaryCard'
import InfoBanner from '../../molecules/InfoBanner'
import ResultsTable from '../../molecules/ResultsTable'
import { STATUS } from '../../../lib/compare'
import { exportRowsToExcel } from '../../../lib/exportExcel'
import { stripAccents } from '../../../lib/normalize'
import './step.css'

const slug = (s) => stripAccents(s).replace(/[^a-z0-9]+/g, '_')

/**
 * Organismo (paso 4): resultados de la validación. Cuatro tarjetas-resumen
 * que filtran la tabla al hacer clic, más la tabla de registros.
 */
function ResultsStep({
  result,
  meta,
  title = 'Paso 7: Resultados de la Validación',
  soloALabel = 'Solo en PDF',
  soloBLabel = 'Solo en Excel',
  filePrefix = 'validacion',
}) {
  const [filter, setFilter] = useState(null)
  const { rows, summary } = result

  const cards = [
    {
      status: STATUS.CORRECTO,
      variant: 'correcto',
      icon: <CheckCircleOutlined />,
      count: summary.correctos,
      label: 'Correctos',
    },
    {
      status: STATUS.ERROR,
      variant: 'error',
      icon: <ExclamationCircleOutlined />,
      count: summary.errores,
      label: 'Con Errores',
    },
    {
      status: STATUS.SOLO_PDF,
      variant: 'pdf',
      icon: <WarningOutlined />,
      count: summary.soloPdf,
      label: soloALabel,
    },
    {
      status: STATUS.SOLO_EXCEL,
      variant: 'excel',
      icon: <TableOutlined />,
      count: summary.soloExcel,
      label: soloBLabel,
    },
  ]

  const filtered = useMemo(
    () => (filter ? rows.filter((r) => r.estado === filter) : rows),
    [rows, filter]
  )

  const toggle = (status) => setFilter((f) => (f === status ? null : status))
  const activeCard = cards.find((c) => c.status === filter)

  return (
    <div className="step">
      <h3 className="step__title">{title}</h3>

      <InfoBanner
        ficha={meta.ficha}
        programa={meta.programa}
        instructor={meta.instructor}
      />

      <div className="results__cards">
        {cards.map((c) => (
          <SummaryCard
            key={c.status}
            variant={c.variant}
            icon={c.icon}
            count={c.count}
            label={c.label}
            active={filter === c.status}
            onClick={() => toggle(c.status)}
          />
        ))}
      </div>

      <div className="results__toolbar">
        <span className="results__filter-hint">
          {filter ? (
            <>
              Mostrando solo «{activeCard.label}» —
              <button
                type="button"
                className="results__clear"
                onClick={() => setFilter(null)}
              >
                ver todos
              </button>
            </>
          ) : (
            `Mostrando todos (${rows.length})`
          )}
        </span>

        <Button
          icon={<DownloadOutlined />}
          onClick={() =>
            exportRowsToExcel(
              filtered,
              `${filePrefix}_${filter ? slug(activeCard.label) : 'todos'}`
            )
          }
          disabled={!filtered.length}
        >
          Descargar Excel{filter ? ` (${activeCard.label})` : ''}
        </Button>
      </div>

      <ResultsTable rows={filtered} />
    </div>
  )
}

export default ResultsStep
