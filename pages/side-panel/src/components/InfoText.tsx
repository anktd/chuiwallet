import * as React from 'react';

export interface InfoTextProps {
  lines: string[];
}

export const InfoText: React.FC<InfoTextProps> = ({ lines }) => {
  return (
    <div className="mt-6 text-lg leading-6 text-foreground">
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {line}
          <br />
        </React.Fragment>
      ))}
    </div>
  );
};
