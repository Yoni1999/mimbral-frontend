"use client";
import React, { useEffect, useState } from "react";
import { Box, Grid,CircularProgress,} from "@mui/material";
import HeaderProducto, { Filters } from "./components/HeaderProductos";
import MetricCard from "./components/MetricCard";
import ProgressGauge from "./components/ProgressGauge";
import dynamic from "next/dynamic";
import VentasChart from "./components/VentasChart";
import {IconCurrencyDollar,IconTrendingUp,IconBox,IconStack2,IconShoppingCart,IconCreditCard,} from "@tabler/icons-react";
import BotonFlotanteMetas from "./components/BotonFlotanteMetas"; // 👈 Importamos el nuevo componente
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { useSearchParams } from "next/navigation";
import { formatVentas, formatUnidades } from "@/utils/format";

const FormaPago = dynamic(() => import("./components/FormaPago"), {
  ssr: false,
});
const VentasVendedores = dynamic(() => import("./components/VentasVendedores"), {
  ssr: false,
});



const VentasVendedorPage: React.FC = () => {
  const [filtros, setFiltros] = useState<Filters>({
    itemCode: "",
    temporada: "",
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    modoComparacion: "",
    canal: "",
  });
  
  const[cargandoFiltros, setCargandoFiltros] = useState(true);

  const[ventasTotal, setVentasTotal] = useState({
    TotalVentasPeriodo: 0,
    TotalVentasAnterior: 0,
    PorcentajeCambio: 0,
  });

  const[margenTotal, setMargenTotal] = useState({
    MargenBrutoPeriodo: 0,
    TotalVentasAnterior: 0,
    MargenBrutoAnterior: 0,
    PorcentajeCambio: 0,
  });
  const[promedioTicket, setPromedioTicket] = useState({
    PromedioPorTicket: 0,
    PromedioAnterior: 0,
    PorcentajeCambio: 0,
  });
  const[unidadesTotal, setUnidadesTotal] = useState({
    CantidadVendida: 0,
    CantidadVendidaAnterior: 0,
    PorcentajeCambio: 0,
  })
  const[nTransacciones, setNTransacciones] = useState({
    CantidadTransaccionesPeriodo: 0,
    CantidadTransaccionesAnterior: 0,
    PorcentajeCambio: 0,
  })
  const[notasCreditoTotal, setNotasCreditoTotal] = useState({
    CantidadNotasCreditoPeriodo: 0,
    CantidadNotasCreditoAnterior: 0,
    PorcentajeCambioNotasCredito: 0,
  })
  const getPeriodoParam = (periodo: string) => {
    switch (periodo) {
      case "1D": return "1d";
      case "7D": return "7d";
      case "14D": return "14d";
      case "1M": return "1m";
      case "3M": return "3m";
      case "6M": return "6m";
      default: return "1d"; // aún puedes dejar un fallback
    }
  };
  

  const buildQuery = (currentFiltros: Filters) => {
    const params = new URLSearchParams();

    if (currentFiltros.periodo) {
      params.append("periodo", getPeriodoParam(currentFiltros.periodo));
    } else {

      if (currentFiltros.fechaInicio) params.append("fechaInicio", currentFiltros.fechaInicio);
      if (currentFiltros.fechaFin) params.append("fechaFin", currentFiltros.fechaFin);
    }

    if (currentFiltros.itemCode) {
      params.append("itemCode", currentFiltros.itemCode);
    }
  
    if (currentFiltros.canal) {
      params.append("canal", currentFiltros.canal);
    }
  
    if (currentFiltros.modoComparacion) {
      params.append("modoComparacion", currentFiltros.modoComparacion);
    }
  
    console.log("🔍 Query generada:", params.toString());
    console.log("📦 Filtros usados:", structuredClone(currentFiltros));
  
    return params.toString();
  };

  const extractFirstOrEmpty = async (response: Response) => {
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : {};
  };
  
const fetchVentasTotal = async (currentFiltros: Filters) => {
  const query = buildQuery(currentFiltros);
  const fullUrl = `${BACKEND_URL}/api/pv/ventastotal?${query}`;

  try {
    const response = await fetchWithToken(fullUrl);

    if (response) {
      const datos = await extractFirstOrEmpty(response);
      setVentasTotal({
        TotalVentasPeriodo: datos.TotalVentasPeriodo || 0,
        TotalVentasAnterior: datos.TotalVentasAnterior || 0,
        PorcentajeCambio: datos.PorcentajeCambio || 0,
      });
    }
  } catch (err) {
    console.error("❌ Error de red:", err);
  }
};
  

  const fetchMargenTotal = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try{
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/margentotal?${query}`);
      if (response){
        const datos = await extractFirstOrEmpty(response);
        setMargenTotal({
          MargenBrutoPeriodo: datos.MargenBrutoPeriodo|| 0,
          MargenBrutoAnterior:datos.MargenBrutoAnterior ||0,
          TotalVentasAnterior: datos.TotalVentasAnterior || 0,
          PorcentajeCambio: datos.PorcentajeCambio || 0,
        });
      }
    }catch (err){
      console.error("Error al obtener el margen total:", err);
    }
  }

  const fetchPromedioTicket = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try{
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/ticketpromedio?${query}`);
      if (response){
        const data = await extractFirstOrEmpty(response);
        setPromedioTicket({
          PromedioPorTicket: data.PromedioPorTicket|| 0,
          PromedioAnterior:data.PromedioAnterior ||0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        });
      }
    }catch (err){
      console.error("Error al obtener promedio por ticket:", err);
    }
  }
  const fetchUnidadesTotal = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try{
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/unidadesvendidas?${query}`);
      if (response){
        const data = await extractFirstOrEmpty(response);
        setUnidadesTotal({
          CantidadVendida: data.CantidadVendida|| 0,
          CantidadVendidaAnterior:data.CantidadVendidaAnterior ||0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        });
      }
    }catch (err){
      console.error("Error al obtener unidades vendidas:", err);
    }
  }
  const fetchNTransacciones = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try{
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/transacciones?${query}`);
      if (response){
        const datos = await extractFirstOrEmpty(response);
        setNTransacciones({
          CantidadTransaccionesPeriodo: datos.CantidadTransaccionesPeriodo|| 0,
          CantidadTransaccionesAnterior:datos.CantidadTransaccionesAnterior ||0,
          PorcentajeCambio: datos.PorcentajeCambio || 0,
        });
      }
    }catch (err){
      console.error("Error al obtener numero de transacciones:", err);
    }
  }
  const fetchNotasCreditoTotal = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try{
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/notascreditopv?${query}`);
      if (response){
        const data = await response.json();
        setNotasCreditoTotal({
          CantidadNotasCreditoPeriodo: data.CantidadNotasCreditoPeriodo|| 0,
          CantidadNotasCreditoAnterior:data.CantidadNotasCreditoAnterior ||0,
          PorcentajeCambioNotasCredito: data.PorcentajeCambioNotasCredito || 0,
        });
      }
    }catch (err){
      console.error("Error al obtener notas de credito:", err);
    }
  }
  const searchParams = useSearchParams();
  
  const mapPeriodoToLabel = (code: string): string => {
    const map: Record<string, string> = {
        "1d": "Hoy",
        "7d": "Ultimos 7 días",
        "14d": "Ultimos 14 días",
        "1m": "Ultimo mes",
        "3m": "3 meses",
        "6m": "6 meses",
    };
    return map[code] || "";
  };

    useEffect(() => {
      setCargandoFiltros(true);
      const filtrosIniciales: Filters = {
        itemCode: searchParams.get("itemCode") || "",
        periodo: mapPeriodoToLabel(searchParams.get("periodo") || ""),
        temporada: searchParams.get("temporada") || "",
        fechaInicio: searchParams.get("fechaInicio") || "",
        fechaFin: searchParams.get("fechaFin") || "",
        canal: searchParams.get("canal") || "", // ✅ agregado
        modoComparacion: searchParams.get("modoComparacion") as Filters["modoComparacion"] || "", // ✅ agregado
      };
      
      setFiltros(filtrosIniciales);
      setCargandoFiltros(false);

      fetchVentasTotal(filtrosIniciales);
      fetchMargenTotal(filtrosIniciales);
      fetchNTransacciones(filtrosIniciales);
      fetchPromedioTicket(filtrosIniciales);
      fetchUnidadesTotal(filtrosIniciales);
      fetchNTransacciones(filtrosIniciales);
      fetchNotasCreditoTotal(filtrosIniciales);
    },[searchParams, setFiltros, setCargandoFiltros]);

    useEffect(() =>{
      if(!cargandoFiltros){
        fetchVentasTotal(filtros);
        fetchMargenTotal(filtros);
        fetchNTransacciones(filtros);
        fetchPromedioTicket(filtros);
        fetchUnidadesTotal(filtros);
        fetchNTransacciones(filtros);
        fetchNotasCreditoTotal(filtros);
      }
    },[filtros, cargandoFiltros]);

    if(cargandoFiltros) {
      return (
        <Box sx= {{ p:5, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      )
    }
    return (
      <Box sx={{ p: 3 }}>
        <HeaderProducto 
          onFilterChange={setFiltros}
          initialFilters={filtros}
        />
    
        {/* Tarjetas y medidores */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <MetricCard
                  title="Ventas Totales"
                  value={formatVentas(ventasTotal.TotalVentasPeriodo)}
                  subtitle={`Periodo Anterior: ${formatVentas(ventasTotal.TotalVentasAnterior)}`}
                  percentageChange={ventasTotal.PorcentajeCambio}
                  tooltipMessage="Este porcentaje compara las ventas actuales con las del período anterior seleccionado."
                  icon={<IconCurrencyDollar />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <MetricCard
                  title="Margen Bruto"
                  value={formatVentas(margenTotal.MargenBrutoPeriodo)}
                  subtitle={`Periodo Anterior: ${formatVentas(margenTotal.MargenBrutoAnterior)}`}
                  percentageChange={margenTotal.PorcentajeCambio}
                  tooltipMessage="Este porcentaje compara las margenes actuales con las del período anterior seleccionado."
                  icon={<IconTrendingUp />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MetricCard
                  title="Promedio Por Ticket"
                  value={formatVentas(promedioTicket.PromedioPorTicket)}
                  subtitle={`Periodo Anterior: ${formatVentas(promedioTicket.PromedioAnterior)}`}
                  percentageChange={promedioTicket.PorcentajeCambio}
                  tooltipMessage="Este porcentaje compara los promedio por ticket actuales con los del período anterior seleccionado."
                  icon={<IconBox />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MetricCard
                  title="Unidades Vendidas"
                  value={formatUnidades(unidadesTotal.CantidadVendida)}
                  subtitle={`Periodo Anterior: ${formatUnidades(unidadesTotal.CantidadVendidaAnterior)}`}
                  percentageChange={unidadesTotal.PorcentajeCambio}
                  tooltipMessage="Este porcentaje compara las unidades vendidas actuales con las del período anterior seleccionado."
                  icon={<IconStack2 />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MetricCard
                  title="N° Transacciones"
                  value={formatUnidades(nTransacciones.CantidadTransaccionesPeriodo)}
                  subtitle={`Periodo Anterior: ${formatUnidades(nTransacciones.CantidadTransaccionesAnterior)}`}
                  percentageChange={nTransacciones.PorcentajeCambio}
                  tooltipMessage="Este porcentaje compara las transacciones actuales con las del período anterior seleccionado."
                  icon={<IconShoppingCart />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MetricCard
                  title="N° Notas de Crédito"
                  value={formatUnidades(notasCreditoTotal.CantidadNotasCreditoPeriodo)}
                  subtitle={`Periodo Anterior: ${formatUnidades(notasCreditoTotal.CantidadNotasCreditoAnterior)}`}
                  percentageChange={notasCreditoTotal.PorcentajeCambioNotasCredito}
                  tooltipMessage="Este porcentaje compara las notas de crédito actuales con las del período anterior seleccionado."
                  icon={<IconCreditCard />}
                />
              </Grid>
            </Grid>
          </Grid>
    
          {/* Medidores a la derecha */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((_, index) => (
                <Grid item xs={12} sm={6} md={6} key={index}>
                  <ProgressGauge
                    value={720}
                    total={1000}
                    title={`Producto ${index + 1}`}
                    detalleRuta="/ventas-vendedor/metas"
                    height={([2, 3].includes(index)) ? 210 : 220}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
    
        {/* Gráficos */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12}>
          <VentasChart filtros={filtros} />
          </Grid>
        </Grid>
    
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12} md={6}>
            <FormaPago />
          </Grid>
          <Grid item xs={12} md={6}>
            <VentasVendedores filtros={filtros} />
          </Grid>
        </Grid>
    
        <BotonFlotanteMetas />
      </Box>
    );    
};

export default VentasVendedorPage;
