export const fetchWithToken = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const token = localStorage.getItem("token");
  
    //  Si no hay token, redirige inmediatamente
    if (!token) {
      window.location.href = "/authentication/login";
      return null;
    }
  
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/authentication/login";
      return null;
    }
  
    return response;
  };
  