import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const saveHtml2Pdf = () => {
  // Hide the buttons
  document.getElementById("sv-nav-complete").style.visibility = "hidden";
  document.getElementById("survey_save_as_file").style.visibility = "hidden";
  // html2canvas(document.body).then(function (canvas) {
  //   // Create a new jsPDF instance
  //   const pdf = new jsPDF({
  //     orientation: "landscape",
  //     unit: "px",
  //     // format: "a4",
  //     format: [canvas.width, canvas.height],
  //   });

  //   const imgData = canvas.toDataURL("image/png");
  //   // const imgProps = pdf.getImageProperties(imgData);
  //   // const pdfWidth = pdf.internal.pageSize.getWidth();
  //   // const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  //   // pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  //   pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  //   pdf.save("download.pdf");
  html2canvas(document.body).then(function (canvas) {
    // Create a new jsPDF instance
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("download.pdf");
    // Show the buttons again
    document.getElementById("sv-nav-complete").style.visibility = "visible";
    document.getElementById("survey_save_as_file").style.visibility = "visible";
  });
};
