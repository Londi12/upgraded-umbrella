import Script from 'next/script'

interface StructuredDataProps {
  data: string
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  )
}

interface MultipleStructuredDataProps {
  dataArray: string[]
}

export function MultipleStructuredData({ dataArray }: MultipleStructuredDataProps) {
  return (
    <>
      {dataArray.map((data, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: data }}
        />
      ))}
    </>
  )
}
