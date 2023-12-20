import React, { useEffect, useState } from "react";
import { load } from "../redux/surveys";
import { useReduxDispatch, useReduxSelector } from "../redux";
import { Link } from "react-router-dom";
import "./Surveys.css";
import { useApi } from "../utils/api";
import icon from "../icon.svg";
import { customers } from "../models/customer";
import { products } from "../models/product";

const Surveys = (): React.ReactElement => {
  const [openModal, setOpenModal] = useState(false);
  const [isValidChecklist, setIsValidChecklist] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isEditModal, setEditModal] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [isConfirmationModal, setConfirmationModal] = useState(false);
  const [isRemoveSurvey, setRemoveSurvey] = useState({});
  const [customer, setCustomer] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<number>(0);
  const [customerProducts, setCustomerProducts] = useState([
    { id: 0, name: "" },
  ]);

  const handleEdit = (
    id: any,
    name: string,
    customer: string,
    product: string
  ) => {
    console.log(customer, product);
    setEditModal(true);
    setInputValue(name);
    setCustomer(customers.filter((cust) => cust.name === customer)[0]?.id);
    setSelectedProduct(products.filter((prod) => prod.name === product)[0]?.id);
    setSelectedId(id);
  };
  const modal = () => {
    setOpenModal(true);
    console.log(openModal);
  };
  const closeModal = () => {
    setOpenModal(false);
    setIsValidChecklist(true);
  };

  const [surveys, setSurveys] = useState<any[]>([]);
  const { fetchData, postData } = useApi();
  const getSurveys = async () => {
    const response = await fetchData("/getActive");
    setSurveys(response.data);
  };

  const duplicateSurvey = async (
    surveyName: string,
    customerName: string,
    productName: string,
    json: string
  ) => {
    const response = await postData("/duplicate", {
      name: surveyName + " copy",
      customer: customerName,
      product: productName,
      json: json,
    });
    if (response.status === 200) {
      console.log(response.data);
      setSurveys([
        ...surveys,
        { ...response.data, customer: customerName, prod_line: productName },
      ]);
      setOpenModal(false);
      setInputValue("");
    }
  };

  const create = async () => {
    if (inputValue === "" || customer === 0 || selectedProduct === 0) {
      setIsValidChecklist(false);
      return;
    }
    const response = await postData("/create", {
      name: inputValue,
      customer: customers.filter((cust) => cust.id === customer)[0]?.name,
      product: products.filter((pro) => pro.id === selectedProduct)[0]?.name,
    });
    if (response.status === 200) {
      setSurveys([...surveys, response.data]);
      setOpenModal(false);
      setInputValue("");
    }
  };

  const update = async () => {
    if (inputValue === "" || customer === 0 || selectedProduct === 0) {
      setIsValidChecklist(false);
      return;
    }
    let updatedCustomer = customers.filter((cust) => cust.id === customer)[0]
      ?.name;
    let updatedProduct = products.filter((pro) => pro.id === selectedProduct)[0]
      ?.name;
    const response = await fetchData(
      `/changeName?name=${inputValue}&id=${selectedId}&customer=${updatedCustomer}&product=${updatedProduct}`
    );
    if (response.status === 200) {
      const index = surveys.findIndex((obj) => {
        return obj.id === selectedId;
      });
      surveys[index].name = inputValue;
      setSurveys([...surveys]);
      setEditModal(false);
      setInputValue("");
    }
  };

  const handleRemove = (surveyData: any) => {
    setConfirmationModal(true);
    setRemoveSurvey(surveyData);
  };
  const cancelRemove = () => {
    setConfirmationModal(false);
  };
  const remove = async (surveyData: any) => {
    const response = await fetchData("/delete?id=" + surveyData.id);
    if (response.status === 200) {
      const index = surveys.indexOf(surveyData);
      surveys.splice(index, 1);
      setSurveys([...surveys]);
      setConfirmationModal(false);
    }
  };
  const dispatch = useReduxDispatch();

  const postStatus = useReduxSelector((state) => state.surveys.status);

  useEffect(() => {
    getSurveys();
  }, []);

  useEffect(() => {
    if (postStatus === "idle") {
      dispatch(load());
    }
  }, [postStatus, dispatch]);

  return (
    <>
      <table className="sjs-surveys-list">
        {surveys.map((survey) => (
          <tr key={survey.id} className="sjs-surveys-list__row">
            <td>
              <span>{survey.name}</span>
              <span>
                <img
                  className="edit-icon"
                  src={icon}
                  onClick={() =>
                    handleEdit(
                      survey.id,
                      survey.name,
                      survey.customer,
                      survey.prod_line
                    )
                  }
                  alt="not found"
                />
              </span>
              <div></div>
            </td>
            <td>
              <span
                className="sjs-button"
                onClick={() =>
                  duplicateSurvey(
                    survey.name,
                    survey.customer,
                    survey.prod_line,
                    survey.json
                  )
                }
              >
                <span>Copy</span>
              </span>
              <Link className="sjs-button" to={"run/" + survey.id}>
                <span>Run</span>
              </Link>
              <Link className="sjs-button" to={"edit/" + survey.id}>
                <span>Edit</span>
              </Link>
              <Link className="sjs-button" to={"results/" + survey.id}>
                <span>Results</span>
              </Link>
              <span
                className="sjs-button sjs-remove-btn"
                onClick={() => handleRemove(survey)}
              >
                Remove
              </span>
            </td>
          </tr>
        ))}
      </table>
      <div className="sjs-surveys-list__footer">
        <span
          className="sjs-button sjs-add-btn"
          title="increment"
          onClick={() => modal()}
        >
          Add Checklist
        </span>
        {openModal && (
          <>
            <div
              className="modal-container "
              onClick={() => closeModal()}
            ></div>
            <div className="modal-content">
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div className="modal-header">
                  <p>Enter New Checklist</p>
                </div>
                <div className="Add-checklist">
                  <div>
                    <label htmlFor="customer" style={{ fontWeight: "600" }}>
                      Select Customer
                    </label>
                    <select
                      name="customer"
                      className="select-dropdown"
                      onChange={(e) => {
                        setCustomerProducts(
                          products.filter(
                            (product) =>
                              product.user_id === parseInt(e.target.value)
                          )
                        );
                        setCustomer(parseInt(e.target.value));
                        setIsValidChecklist(true);
                      }}
                    >
                      <option value="">Choose a customer from list</option>
                      {customers.map((customer) => (
                        <option
                          key={customer.id}
                          style={{ textTransform: "capitalize" }}
                          value={customer.id}
                        >
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label htmlFor="product" style={{ fontWeight: "600" }}>
                      Select Product Line
                    </label>
                    <select
                      name="product"
                      className="select-dropdown"
                      onChange={(e) => {
                        setSelectedProduct(parseInt(e.target.value));
                        setIsValidChecklist(true);
                      }}
                    >
                      <option value="">Choose a product line from list</option>
                      {customerProducts.map((product) => (
                        <option
                          key={product.id}
                          style={{ textTransform: "capitalize" }}
                          value={product.id}
                        >
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label htmlFor="name" style={{ fontWeight: "600" }}>
                      Checklist Name
                    </label>
                    <input
                      type="text"
                      placeholder="Add Checklist Name"
                      value={inputValue}
                      style={{ marginTop: 4 }}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsValidChecklist(true);
                      }}
                    />
                  </div>
                </div>
                {!isValidChecklist && (
                  <p className="input-remark">
                    Customer, Product line & checklist name are required fields
                  </p>
                )}
                <div className="buttons">
                  <button
                    className="modal-button cancle-button"
                    onClick={() => closeModal()}
                  >
                    Cancel
                  </button>
                  <button className="modal-button" onClick={() => create()}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        {isEditModal && (
          <>
            <div
              className="modal-container "
              onClick={() => setEditModal(false)}
            ></div>
            <div className="modal-content">
              <div>
                <div className="modal-header">
                  <p>Edit Checklist</p>
                </div>
                <div className="Add-checklist">
                  <div>
                    <label htmlFor="customer" style={{ fontWeight: "600" }}>
                      Select Customer
                    </label>
                    <select
                      name="customer"
                      className="select-dropdown"
                      value={customer}
                      onChange={(e) => {
                        setCustomerProducts(
                          products.filter(
                            (product) =>
                              product.user_id === parseInt(e.target.value)
                          )
                        );
                        setCustomer(parseInt(e.target.value));
                        setSelectedProduct(0);
                        setIsValidChecklist(true);
                      }}
                    >
                      <option value="">Choose a customer from list</option>
                      {customers.map((customer) => (
                        <option
                          key={customer.id}
                          style={{ textTransform: "capitalize" }}
                          value={customer.id}
                        >
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label htmlFor="product" style={{ fontWeight: "600" }}>
                      Select Product Line
                    </label>
                    <select
                      name="product"
                      className="select-dropdown"
                      value={selectedProduct}
                      onChange={(e) => {
                        setSelectedProduct(parseInt(e.target.value));
                        setIsValidChecklist(true);
                      }}
                    >
                      {selectedProduct > 0 ? (
                        <option value={selectedProduct}>
                          {
                            products.filter(
                              (pro) => pro.id === selectedProduct
                            )[0]?.name
                          }
                        </option>
                      ) : (
                        <option value="">
                          Choose a product line from list
                        </option>
                      )}
                      {customerProducts.map((product) => (
                        <option
                          key={product.id}
                          style={{ textTransform: "capitalize" }}
                          value={product.id}
                        >
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label htmlFor="name" style={{ fontWeight: "600" }}>
                      Checklist Name
                    </label>
                    <input
                      type="text"
                      placeholder="Edit Checklist Name"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsValidChecklist(true);
                      }}
                    />
                  </div>
                </div>
                {!isValidChecklist && (
                  <p className="input-remark">
                    Customer, Product line & checklist name are required fields
                  </p>
                )}
                <div className="buttons">
                  <button
                    className="modal-button cancle-button"
                    onClick={() => setEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="modal-button" onClick={() => update()}>
                    Update
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        {isConfirmationModal && (
          <>
            <div
              className="modal-container "
              onClick={() => setConfirmationModal(false)}
            ></div>
            <div className=" confirm-modal">
              <div>
                <div className="confirmModal-header">
                  <p>Are you sure you want to remove this checklist?</p>
                </div>

                <div className="buttons">
                  <button
                    className="modal-button cancle-button"
                    onClick={() => cancelRemove()}
                  >
                    No
                  </button>
                  <button
                    className="modal-button"
                    onClick={() => remove(isRemoveSurvey)}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Surveys;
