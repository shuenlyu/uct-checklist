import React from "react";

export interface PdfOptions {
  fontSize: number;
  fontName: string;
  margins: {
    left: number;
    right: number;
    top: number;
    bot: number;
  };
  orientation: "p" | "l" | undefined;
  format: string;
}

export interface PrintOptionsModalProps {
  fileName: string;
  setFileName: (value: string) => void;
  pdfOptions: PdfOptions;
  setPdfOptions: (options: PdfOptions) => void;
  savePdf: () => void;
  closeModal: () => void;
}

const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({
  fileName,
  setFileName,
  pdfOptions,
  setPdfOptions,
  savePdf,
  closeModal,
}) => {
  const handleSaveAndClose = () => {
    savePdf();
    closeModal();
  };
  return (
    <>
      <div className="modal-container" onClick={closeModal}></div>
      <div className="print-options-modal">
        <div>
          <div className="flex">
            <label
              htmlFor="file-name"
              style={{ fontWeight: "600", display: "block" }}
            >
              File Name
            </label>
            <input
              type="text"
              placeholder="Enter File Name"
              style={{ marginTop: 5, padding: "8px 4px", width: "99%" }}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 20 }}>
            <label htmlFor="paper-size" style={{ fontWeight: "600" }}>
              Paper Size
            </label>
            <select
              name="paper-size"
              className="select-dropdown"
              value={pdfOptions.format}
              onChange={(e) =>
                setPdfOptions({ ...pdfOptions, format: e.target.value })
              }
            >
              {/* Add other options as needed */}
              <option value="a2">A2</option>
              <option value="a0">A0</option>
              <option value="a3">A3</option>
              <option value="a4">A4</option>
              <option value="b0">B0</option>
              <option value="c0">C0</option>
              <option value="dl">DL</option>
              <option value="letter">Letter</option>
              <option value="government-letter">Government Letter</option>
              <option value="legal">Legal</option>
              <option value="junior-legal">Junior Legal</option>
              <option value="ledger">Ledger</option>
              <option value="tabloid">Tabloid</option>
              <option value="credit-card">Credit Card</option>
            </select>
          </div>
          <div style={{ marginTop: 20 }}>
            <label htmlFor="orientation" style={{ fontWeight: "600" }}>
              Page Orientation
            </label>
            <select
              name="orientation"
              className="select-dropdown"
              value={pdfOptions.orientation}
              onChange={(e) =>
                setPdfOptions({
                  ...pdfOptions,
                  orientation: e.target.value as "p" | "l" | undefined,
                })
              }
            >
              <option value="p">Portrait</option>
              <option value="l">Landscape</option>
            </select>
          </div>
          <div style={{ marginTop: 20 }}>
            <label htmlFor="margin" style={{ fontWeight: "600" }}>
              Margins
            </label>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <input
                type="number"
                placeholder="Left"
                className="w-20"
                value={pdfOptions.margins.left}
                onChange={(e) =>
                  setPdfOptions({
                    ...pdfOptions,
                    margins: {
                      ...pdfOptions.margins,
                      left: parseInt(e.target.value),
                    },
                  })
                }
              />
              <input
                type="number"
                placeholder="Top"
                className="w-20"
                value={pdfOptions.margins.top}
                onChange={(e) =>
                  setPdfOptions({
                    ...pdfOptions,
                    margins: {
                      ...pdfOptions.margins,
                      top: parseInt(e.target.value),
                    },
                  })
                }
              />
              <input
                type="number"
                placeholder="Right"
                className="w-20"
                value={pdfOptions.margins.right}
                onChange={(e) =>
                  setPdfOptions({
                    ...pdfOptions,
                    margins: {
                      ...pdfOptions.margins,
                      right: parseInt(e.target.value),
                    },
                  })
                }
              />
              <input
                type="number"
                placeholder="Bottom"
                className="w-20"
                value={pdfOptions.margins.bot}
                onChange={(e) =>
                  setPdfOptions({
                    ...pdfOptions,
                    margins: {
                      ...pdfOptions.margins,
                      bot: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div style={{ width: "20%" }}>
              <label
                htmlFor="font-size"
                style={{ fontWeight: "600", display: "block" }}
              >
                Font Size
              </label>
              <input
                type="number"
                placeholder="Font Size"
                style={{ marginTop: 10, padding: "8px 4px", width: "100%" }}
                value={pdfOptions.fontSize}
                onChange={(e) =>
                  setPdfOptions({
                    ...pdfOptions,
                    fontSize: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div style={{ width: "70%" }}>
              <label htmlFor="font-style" style={{ fontWeight: "600" }}>
                Font Style
              </label>
              <select
                name="font-style"
                className="select-dropdown"
                style={{ marginTop: 10 }}
                value={pdfOptions.fontName}
                onChange={(e) =>
                  setPdfOptions({
                    ...pdfOptions,
                    fontName: e.target.value,
                  })
                }
              >
                <option value="Helvetica">Helvetica</option>
                <option value="Courier">Courier</option>
                <option value="Times">Times</option>
                <option value="Symbol">Symbol</option>
                <option value="ZapfDingbats">ZapfDingbats</option>
              </select>
            </div>
          </div>
        </div>
        <div className="buttons">
          <button className="modal-button cancel-button" onClick={closeModal}>
            Cancel
          </button>
          <button className="modal-button" onClick={handleSaveAndClose}>
            Export
          </button>
        </div>
      </div>
    </>
  );
};

export default PrintOptionsModal;
