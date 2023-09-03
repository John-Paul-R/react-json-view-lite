import * as React from 'react';
import * as DataTypeDetection from './DataTypeDetection';
import { useBool } from './hooks';

export interface StyleProps {
  container: string;
  basicChildStyle: string;
  label: string;
  nullValue: string;
  undefinedValue: string;
  numberValue: string;
  stringValue: string;
  booleanValue: string;
  otherValue: string;
  punctuation: string;
  expandIcon: string;
  collapseIcon: string;
  collapsedContent: string;
}

export interface JsonRenderProps<T> {
  field?: string;
  value: T;
  lastElement: boolean;
  level: number;
  style: StyleProps;
  shouldInitiallyExpand: (level: number, value: any, field?: string) => boolean;
}

export interface ExpandableRenderProps {
  field?: string;
  value: Array<any> | object;
  data: Array<[string | undefined, any]>;
  openBracket: string;
  closeBracket: string;
  lastElement: boolean;
  level: number;
  style: StyleProps;
  shouldInitiallyExpand: (level: number, value: any, field?: string) => boolean;
}

function ExpandableObject({
  field,
  value,
  data,
  lastElement,
  openBracket,
  closeBracket,
  level,
  style,
  shouldInitiallyExpand
}: ExpandableRenderProps) {
  const shouldInitiallyExpandCalledRef = React.useRef(false);
  const [expanded, toggleExpanded, setExpanded] = useBool(() =>
    shouldInitiallyExpand(level, value, field)
  );

  React.useEffect(() => {
    if (!shouldInitiallyExpandCalledRef.current) {
      shouldInitiallyExpandCalledRef.current = true;
    } else {
      setExpanded(shouldInitiallyExpand(level, value, field));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldInitiallyExpand]);

  const expanderIconStyle = expanded ? style.collapseIcon : style.expandIcon;
  const childLevel = level + 1;
  const lastIndex = data.length - 1;

  const onKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === ' ') {
      toggleExpanded();
    }
  };

  return (
    <div className={style.basicChildStyle} role='list'>
      <span
        className={expanderIconStyle}
        role='button'
        onClick={toggleExpanded}
        onKeyDown={onKeyDown}
        tabIndex={0}
      />
      {field && <span className={style.label}>{field}:</span>}
      <span className={style.punctuation}>{openBracket}</span>

      {expanded ? (
        <div>
          {data.map((dataElement, index) => (
            <DataRender
              key={dataElement[0] || index}
              field={dataElement[0]}
              value={dataElement[1]}
              style={style}
              lastElement={index === lastIndex}
              level={childLevel}
              shouldInitiallyExpand={shouldInitiallyExpand}
            />
          ))}
        </div>
      ) : (
        <span
          className={style.collapsedContent}
          role='button'
          tabIndex={0}
          onClick={toggleExpanded}
          onKeyDown={onKeyDown}
        />
      )}

      <span className={style.punctuation}>{closeBracket}</span>
      {!lastElement && <span className={style.punctuation}>,</span>}
    </div>
  );
}

function JsonObject({
  field,
  value,
  style,
  lastElement,
  shouldInitiallyExpand,
  level
}: JsonRenderProps<Object>) {
  return ExpandableObject({
    field,
    value,
    lastElement: lastElement || false,
    level,
    openBracket: '{',
    closeBracket: '}',
    style,
    shouldInitiallyExpand,
    data: Object.keys(value).map((key) => [key, value[key as keyof typeof value]])
  });
}

function JsonArray({
  field,
  value,
  style,
  lastElement,
  level,
  shouldInitiallyExpand
}: JsonRenderProps<Array<any>>) {
  return ExpandableObject({
    field,
    value,
    lastElement: lastElement || false,
    level,
    openBracket: '[',
    closeBracket: ']',
    style,
    shouldInitiallyExpand,
    data: value.map((element) => [undefined, element])
  });
}

function JsonPrimitiveValue({
  field,
  value,
  style,
  lastElement
}: JsonRenderProps<string | number | boolean | null | undefined>) {
  let stringValue = value;
  let valueStyle = style.otherValue;

  if (value === null) {
    stringValue = 'null';
    valueStyle = style.nullValue;
  } else if (value === undefined) {
    stringValue = 'undefined';
    valueStyle = style.undefinedValue;
  } else if (DataTypeDetection.isString(value)) {
    stringValue = `"${value}"`;
    valueStyle = style.stringValue;
  } else if (DataTypeDetection.isBoolean(value)) {
    stringValue = value ? 'true' : 'false';
    valueStyle = style.booleanValue;
  } else if (DataTypeDetection.isNumber(value)) {
    stringValue = value.toString();
    valueStyle = style.numberValue;
  } else if (DataTypeDetection.isBigInt(value)) {
    stringValue = `${value.toString()}n`;
    valueStyle = style.numberValue;
  } else {
    stringValue = value.toString();
  }

  if (field === '') {
    field = '""';
  }

  return (
    <div className={style.basicChildStyle} role='listitem'>
      {field && <span className={style.label}>{field}:</span>}
      <span className={valueStyle}>{stringValue}</span>
      {!lastElement && <span className={style.punctuation}>,</span>}
    </div>
  );
}

export default function DataRender(props: JsonRenderProps<any>) {
  const value = props.value;
  if (DataTypeDetection.isArray(value)) {
    return <JsonArray {...props} />;
  }

  if (DataTypeDetection.isObject(value)) {
    return <JsonObject {...props} />;
  }

  return <JsonPrimitiveValue {...props} />;
}
