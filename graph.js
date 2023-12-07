function visualizeNetwork(data, svg) {
  const svgWidth = parseInt(svg.attr("viewBox").split(" ")[2]);
  const svgHeight = parseInt(svg.attr("viewBox").split(" ")[3]);
  const mainGroup = svg.append("g").attr("transform", "translate(0, 50)");

  let nodeSizeType = "publications"; // Default node size option

  function updateNodeSize(type) {
    nodeSizeType = type;
    updateNodeRadius();
  }

  d3.selectAll('input[name="nodeSizeType"]').on("change", function () {
    updateNodeSize(this.value);
  });

  function updateNodeRadius() {
    nodeElements.selectAll("circle").attr("r", function (d) {
      let radius;
      if (nodeSizeType === "publications") {
        radius = scaleNodeRadius(d.Authors.length * 1.2);
      } else if (nodeSizeType === "degree") {
        radius = scaleNodeRadius(nodeDegree[d.id]);
      } else if (nodeSizeType === "citations") {
        radius = scaleNodeRadius(d.Citations / 8);
      } else {
        radius = scaleNodeRadius(0);
      }
      return radius;
    });
  }

  let nodeDegree = calculateNodeDegree(data.links);

  function calculateNodeDegree(links) {
    const degree = {};
    d3.map(links, (link) => {
      updateDegree(link.source);
      updateDegree(link.target);
    });

    function updateDegree(node) {
      if (node in degree) {
        degree[node]++;
      } else {
        degree[node] = 0;
      }
    }

    return degree;
  }

  const scaleNodeRadius = d3
    .scaleLinear()
    .domain(d3.extent(Object.values(nodeDegree)))
    .range([3, 12]);

  const nodeColorScale = d3
    .scaleSequential()
    .domain([1995, 2020])
    .interpolator(d3.interpolateReds);

  let collideInput = document.getElementById("collide");
  let chargeInput = document.getElementById("charge");
  let linkStrengthInput = document.getElementById("linkStrength");

  collideInput.addEventListener("input", updateCollideForce);
  chargeInput.addEventListener("input", updateChargeForce);
  linkStrengthInput.addEventListener("input", updateLinkStrength);

  let collideForce = d3.forceCollide().radius(0);
  let chargeForce = d3.forceManyBody().strength(-55);
  let linkForce = d3
    .forceLink(data.links)
    .id((link) => link.id)
    .strength(0.4);

  let forceSimulation = d3
    .forceSimulation(data.nodes)
    .force("collide", collideForce)
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("charge", chargeForce)
    .force("link", linkForce)
    .on("tick", updateNodePositions);

  function updateCollideForce() {
    let radius = parseInt(collideInput.value);
    collideForce.radius(radius);
    forceSimulation.alpha(0.5).restart();
  }

  function updateChargeForce() {
    let strength = parseInt(chargeInput.value);
    chargeForce.strength(strength);
    forceSimulation.alpha(0.5).restart();
  }

  function updateLinkStrength() {
    let strength = parseFloat(linkStrengthInput.value);
    linkForce.strength(strength);
    forceSimulation.alpha(0.5).restart();
  }

  let linkElements = mainGroup
    .append("g")
    .attr("transform", `translate(${svgWidth / 2},${svgHeight / 2})`)
    .attr("stroke", "#999")
    .attr("stroke-width", "3")
    .attr("stroke-opacity", 0.6)
    .selectAll(".line")
    .data(data.links)
    .enter()
    .append("line");

  const nodeElements = mainGroup
    .append("g")
    .attr("transform", `translate(${svgWidth / 2},${svgHeight / 2})`)
    .selectAll(".circle")
    .data(data.nodes)
    .enter()
    .append("g")
    .attr("r", (node) => node.Citations)
    .attr("fill", (node) => nodeColorScale(node.Year))
    .attr("class", function (node) {
      return "gr" + node.Country.replace(/\s+/g, "-").toLowerCase();
    })
    .on("click", function (node, data) {
      updateNodeInfo(data);
    });

  nodeElements.append("circle").attr("r", function (node) {
    if (nodeDegree[node.id] !== undefined) {
      return scaleNodeRadius(nodeDegree[node.id]);
    } else {
      return scaleNodeRadius(0);
    }
  });

  function updateNodePositions() {
    nodeElements.attr("transform", (node) => `translate(${node.x},${node.y})`);
    linkElements
      .attr("x1", (link) => link.source.x)
      .attr("x2", (link) => link.target.x)
      .attr("y1", (link) => link.source.y)
      .attr("y2", (link) => link.target.y);
  }

  svg.call(
    d3
      .zoom()
      .extent([
        [0, 0],
        [svgWidth, svgHeight],
      ])
      .scaleExtent([-1, 8])
      .on("zoom", handleZoom)
  );

  function handleZoom({ transform }) {
    mainGroup.attr("transform", transform);
  }

  // Call the updateNodeRadius function initially
  updateNodeRadius();

  function updateNodeInfo(data) {
    d3.selectAll("#paper").text(` ${data.Title}`);
    d3.selectAll("#authorname").text(` ${data.Authors}`);
    d3.selectAll("#country").text(` ${data.Country}`);
    d3.selectAll("#year").text(` ${data.Year}`);
  }
}
