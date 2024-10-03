import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  List,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

interface Data {
  email: string;
  id: number;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Fetch all customers
  const response = await admin.rest.resources.Customer.all({ session });

  const customers: Data[] = response.data.map((customer: any) => ({
    email: customer.email,
    id: customer.id,
  }));

  return json({ customers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const customerId = formData.get("customerId");

  // Fetch specific customer's orders
  const ordersResponse = await admin.graphql(
    `#graphql
    query getCustomerOrders($customerId: ID!) {
      customer(id: $customerId) {
        id
        email
        orders(first: 10) {
          edges {
            node {
              id
              confirmed
              netPaymentSet {
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }`,
    { variables: { customerId: `gid://shopify/Customer/${customerId}` } }
  );

  // Parse the response
  const ordersJson = await ordersResponse.json();
  
  // Extract orders from the parsed response
  const orders = ordersJson.data.customer.orders.edges.map((order: any) => ({
    id: order.node.id,
    confirmed: order.node.confirmed,
    netPayment: order.node.netPaymentSet.presentmentMoney.amount,
    currency: order.node.netPaymentSet.presentmentMoney.currencyCode,
  }));

  return json({ orders });
};

export default function Index() {
  const fetcher = useFetcher();
  const { customers } = useLoaderData<{ customers: Data[] }>();
  const [selectedCustomer, setSelectedCustomer] = useState<Data | null>(null);

  const fetchOrders = (customer: Data) => {
    setSelectedCustomer(customer);
    fetcher.submit({ customerId: customer.id.toString() }, { method: "post" });
  };

  return (
    <Page title="Customer and Product Management">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2">Customer List</Text>
            {customers.length ? (
              <List>
                {customers.map((customer) => (
                  <List.Item key={customer.id}>
                    {customer.email} (ID: {customer.id}){" "}
                    <Button onClick={() => fetchOrders(customer)} plain>
                      View Orders
                    </Button>
                  </List.Item>
                ))}
              </List>
            ) : (
              <div>No customers found.</div>
            )}
          </Card>

          {/* Order List */}
          {fetcher.data?.orders && (
            <Card title={`Orders for ${selectedCustomer?.email}`}>
              {fetcher.data.orders.length ? (
                <List>
                  {fetcher.data.orders.map((order: any) => (
                    <List.Item key={order.id}>
                      Order ID: {order.id} - Confirmed:{" "}
                      {order.confirmed ? "Yes" : "No"} - Net Payment:{" "}
                      {order.netPayment} {order.currency}
                    </List.Item>
                  ))}
                </List>
              ) : (
                <div>No orders found for this customer.</div>
              )}
            </Card>
          )}

          <Button onClick={() => fetcher.submit({}, { method: "POST" })}>
            Generate Random Product
          </Button>
          <Button onClick={() => sessionStorage.setItem('discount',20)}>
            discount
          </Button>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
