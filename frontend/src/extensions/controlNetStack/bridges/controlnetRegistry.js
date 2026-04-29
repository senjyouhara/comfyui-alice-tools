export function getAvailableControlNets() {
  const values = LiteGraph.registered_node_types?.ControlNetLoader?.nodeData?.input?.required?.control_net_name?.[0];
  return Array.isArray(values) ? values : [];
}
